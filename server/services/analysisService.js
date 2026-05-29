import pool from "../db/pool.js";
import { fetchRepoTree, fetchFileContent, filterRelevantFiles } from "./githubService.js";
import { analyzeFile, generateMermaid } from "./openRouterService.js";
import { enqueue } from "./queueService.js";

/**
 * Déduit le langage à partir de l'extension du fichier (js, ts, py...).
 * @param {string} filePath
 * @returns {string}
 */
const detectLanguage = (filePath) => {
    return filePath.split(".").pop().toLowerCase();
};

/**
 * Crée une nouvelle analyse (statut "queued") pour un projet et l'ajoute à la file.
 * @param {number} projectId
 * @param {number} userId
 * @returns {Promise<object|null>} L'analyse créée, ou null si le projet n'appartient pas à l'utilisateur.
 */
export const create = async (projectId, userId) => {
    // Vérifie que le projet appartient bien à l'utilisateur connecté.
    const [projects] = await pool.query(
        `SELECT pk_project FROM t_project WHERE pk_project = ? AND fk_user = ?`,
        [projectId, userId]
    );

    if (projects.length === 0) {
        return null;
    }

    const [result] = await pool.query(
        `INSERT INTO t_analysis (fk_project, status) VALUES (?, 'queued')`,
        [projectId]
    );

    const analysisId = result.insertId;

    // Lance l'analyse en arrière-plan via la file d'attente.
    enqueue(() => run(analysisId));

    return findById(analysisId);
};

/**
 * Exécute l'analyse complète : fetch repo, analyse chaque fichier via le LLM,
 * persiste les résultats, génère le diagramme Mermaid, met à jour le statut.
 * @param {number} analysisId
 * @returns {Promise<void>}
 */
export const run = async (analysisId) => {
    try {
        await markRunning(analysisId);

        // 1. Récupère l'URL du dépôt et le token du propriétaire (via jointures).
        const [rows] = await pool.query(
            `SELECT p.github_repo_url, u.access_token
             FROM t_analysis a
             JOIN t_project p ON p.pk_project = a.fk_project
             JOIN t_user u ON u.pk_user = p.fk_user
             WHERE a.pk_analysis = ?`,
            [analysisId]
        );

        if (rows.length === 0) {
            throw new Error("Analyse ou projet introuvable");
        }

        const repoUrl = rows[0].github_repo_url;
        const token = rows[0].access_token;

        // 2. Récupère l'arborescence et garde uniquement les fichiers de code.
        const tree = await fetchRepoTree(repoUrl, token);
        const files = filterRelevantFiles(tree);

        await markRunning(analysisId, files.length);

        // 3. Analyse chaque fichier un par un.
        const structure = [];

        for (const file of files) {
            try {
                const content = await fetchFileContent(repoUrl, file.path, token);
                const language = detectLanguage(file.path);

                const result = await analyzeFile({ path: file.path, content, language });

                // Sauvegarde le fichier analysé et récupère son id.
                const [fileResult] = await pool.query(
                    `INSERT INTO t_analyzed_file (fk_analysis, file_path, language, file_summary)
                     VALUES (?, ?, ?, ?)`,
                    [analysisId, file.path, language, result.file_summary]
                );

                const analyzedFileId = fileResult.insertId;

                // Sauvegarde chaque erreur détectée dans ce fichier.
                for (const error of result.errors) {
                    await pool.query(
                        `INSERT INTO t_detected_error
                            (fk_analyzed_file, line_number, error_type, severity,
                             description, code_snippet, fix_description, fix_suggested_code)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            analyzedFileId,
                            error.line_number,
                            error.error_type,
                            error.severity,
                            error.description,
                            error.code_snippet,
                            error.suggested_fix?.description ?? null,
                            error.suggested_fix?.suggested_code ?? null,
                        ]
                    );
                }

                structure.push({ path: file.path, language });
            } catch (err) {
                // Un fichier qui échoue ne doit pas arrêter toute l'analyse : on le saute.
                console.error(`Fichier ignoré (${file.path}) :`, err.message);
            }
        }

        // 4. Génère le diagramme Mermaid global du projet.
        const mermaid = await generateMermaid(structure);

        // 5. Analyse terminée avec succès.
        await markCompleted(analysisId, mermaid);
    } catch (err) {
        console.error(`Analyse ${analysisId} échouée :`, err);
        await markFailed(analysisId, err.message);
    }
};

/**
 * Recherche une analyse par son id.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const findById = async (id) => {
    const [rows] = await pool.query(
        `SELECT pk_analysis AS id, fk_project AS project_id, commit_sha, status,
                files_total, code_overview, mermaid_diagram, error_message, analysis_date,
                (SELECT COUNT(*) FROM t_analyzed_file WHERE fk_analysis = pk_analysis) AS files_done
         FROM t_analysis
         WHERE pk_analysis = ?`,
        [id]
    );

    return rows[0] ?? null;
};

/**
 * Liste les analyses d'un projet (les plus récentes d'abord).
 * @param {number} projectId
 * @returns {Promise<object[]>}
 */
export const listByProjectId = async (projectId) => {
    const [rows] = await pool.query(
        `SELECT pk_analysis AS id, status, files_total, analysis_date
         FROM t_analysis
         WHERE fk_project = ?
         ORDER BY analysis_date DESC`,
        [projectId]
    );

    return rows;
};

/**
 * Retourne l'analyse complète avec ses fichiers et leurs erreurs/fixes.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const getFullResult = async (id) => {
    const analysis = await findById(id);

    if (!analysis) {
        return null;
    }

    const [files] = await pool.query(
        `SELECT pk_analyzed_file AS id, file_path, language, file_summary
         FROM t_analyzed_file
         WHERE fk_analysis = ?`,
        [id]
    );

    // Pour chaque fichier, on récupère ses erreurs détectées.
    for (const file of files) {
        const [errors] = await pool.query(
            `SELECT line_number, error_type, severity, description,
                    code_snippet, fix_description, fix_suggested_code
             FROM t_detected_error
             WHERE fk_analyzed_file = ?`,
            [file.id]
        );

        file.errors = errors;
    }

    analysis.files = files;
    return analysis;
};

/**
 * Passe une analyse en "running". files_total est rempli quand on connaît le
 * nombre de fichiers (null au tout début).
 * @param {number} id
 * @param {number|null} [filesTotal]
 * @returns {Promise<void>}
 */
export const markRunning = async (id, filesTotal) => {
    await pool.query(
        `UPDATE t_analysis SET status = 'running', files_total = ? WHERE pk_analysis = ?`,
        [filesTotal ?? null, id]
    );
};

/**
 * Passe une analyse en "completed" et enregistre le diagramme Mermaid.
 * @param {number} id
 * @param {string} mermaidDiagram
 * @returns {Promise<void>}
 */
export const markCompleted = async (id, mermaidDiagram) => {
    await pool.query(
        `UPDATE t_analysis SET status = 'completed', mermaid_diagram = ? WHERE pk_analysis = ?`,
        [mermaidDiagram, id]
    );
};

/**
 * Passe une analyse en "failed" et enregistre le message d'erreur.
 * @param {number} id
 * @param {string} errorMessage
 * @returns {Promise<void>}
 */
export const markFailed = async (id, errorMessage) => {
    await pool.query(
        `UPDATE t_analysis SET status = 'failed', error_message = ? WHERE pk_analysis = ?`,
        [errorMessage, id]
    );
};
