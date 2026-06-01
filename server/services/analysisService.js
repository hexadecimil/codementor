import pool from "../db/pool.js";
import { fetchRepoTree, fetchFileContent, filterRelevantFiles } from "./githubService.js";
import { analyzeFile, generateMermaid, generateOverview } from "./openRouterService.js";
import { enqueue } from "./queueService.js";
import { decrypt } from "../utils/crypto.js";
import { detectLanguage } from "../utils/files.js";

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
/**
 * Traite un seul fichier : récupération du contenu, analyse IA, sauvegarde du
 * fichier et de ses erreurs. Un fichier en échec est ignoré (retourne null)
 * sans interrompre le reste de l'analyse.
 * @param {number} analysisId
 * @param {string} repoUrl
 * @param {string} token
 * @param {{path: string}} file
 * @returns {Promise<{path: string, language: string, summary: string}|null>}
 */
const analyzeOneFile = async (analysisId, repoUrl, token, file) => {
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

        return { path: file.path, language, summary: result.file_summary };
    } catch (err) {
        // Un fichier qui échoue ne doit pas arrêter toute l'analyse : on le saute.
        console.error(`Fichier ignoré (${file.path}) :`, err.message);
        return null;
    }
};

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
        const token = decrypt(rows[0].access_token);

        // 2. Récupère l'arborescence et garde uniquement les fichiers de code.
        const { tree, commitSha } = await fetchRepoTree(repoUrl, token);
        const files = filterRelevantFiles(tree);

        await markRunning(analysisId, files.length, commitSha);

        // 3. Analyse les fichiers par lots parallèles (FILE_CONCURRENCY à la fois)
        // pour accélérer : plusieurs appels IA en même temps au lieu d'un par un.
        const CONCURRENCY = Number(process.env.FILE_CONCURRENCY) || 5;
        const structure = [];

        for (let i = 0; i < files.length; i += CONCURRENCY) {
            const batch = files.slice(i, i + CONCURRENCY);
            const results = await Promise.all(
                batch.map((file) => analyzeOneFile(analysisId, repoUrl, token, file))
            );
            // analyzeOneFile renvoie null pour un fichier en échec : on l'écarte.
            structure.push(...results.filter(Boolean));
        }

        // 4. Génère la vue d'ensemble et le diagramme Mermaid global du projet.
        const overview = await generateOverview(structure);
        const mermaid = await generateMermaid(structure);

        // 5. Analyse terminée avec succès.
        await markCompleted(analysisId, mermaid, overview);
    } catch (err) {
        console.error(`Analyse ${analysisId} échouée :`, err);
        await markFailed(analysisId, err.message);
    }
};

/**
 * Analyse un fichier (récupération + LLM) et persiste son résumé et ses erreurs.
 * Un fichier en échec est ignoré sans interrompre le reste de l'analyse.
 * @param {number} analysisId
 * @param {string} repoUrl
 * @param {string} token
 * @param {object} file
 * @returns {Promise<{path: string, language: string, summary: string}|null>}
 */
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

// Calcule le pourcentage d'avancement (0-100) d'une analyse.
const computeProgress = (status, filesTotal, filesDone) => {
    if (status === "completed") return 100;
    if (status === "failed" || !filesTotal) return 0;
    return Math.min(100, Math.round((filesDone / filesTotal) * 100));
};

/**
 * Retourne l'état d'avancement léger d'une analyse, pour le polling du frontend.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
export const getProgress = async (id) => {
    const [rows] = await pool.query(
        `SELECT pk_analysis AS id, fk_project AS project_id, status, files_total,
                (SELECT COUNT(*) FROM t_analyzed_file WHERE fk_analysis = pk_analysis) AS files_done
         FROM t_analysis
         WHERE pk_analysis = ?`,
        [id]
    );

    if (!rows[0]) return null;

    const { id: analysisId, project_id, status, files_total, files_done } = rows[0];
    return {
        id: analysisId,
        project_id,
        status,
        files_total,
        files_done,
        progress_percent: computeProgress(status, files_total, files_done),
    };
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
 * Passe une analyse en "running". files_total et commit_sha sont remplis une
 * fois l'arborescence récupérée (null au tout début).
 * @param {number} id
 * @param {number|null} [filesTotal]
 * @param {string|null} [commitSha]
 * @returns {Promise<void>}
 */
export const markRunning = async (id, filesTotal, commitSha) => {
    await pool.query(
        `UPDATE t_analysis
         SET status = 'running', files_total = ?, commit_sha = ?
         WHERE pk_analysis = ?`,
        [filesTotal ?? null, commitSha ?? null, id]
    );
};

/**
 * Passe une analyse en "completed" et enregistre la vue d'ensemble et le Mermaid.
 * @param {number} id
 * @param {string} mermaidDiagram
 * @param {string} codeOverview
 * @returns {Promise<void>}
 */
export const markCompleted = async (id, mermaidDiagram, codeOverview) => {
    await pool.query(
        `UPDATE t_analysis
         SET status = 'completed', mermaid_diagram = ?, code_overview = ?
         WHERE pk_analysis = ?`,
        [mermaidDiagram, codeOverview, id]
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

/**
 * Au démarrage du serveur, marque comme "failed" les analyses restées "queued"
 * ou "running" : la file est en mémoire, ces tâches ont été perdues au dernier arrêt.
 * @returns {Promise<void>}
 */
export const recoverInterruptedAnalyses = async () => {
    const [result] = await pool.query(
        `UPDATE t_analysis
         SET status = 'failed', error_message = 'Analyse interrompue (redémarrage du serveur)'
         WHERE status IN ('queued', 'running')`
    );

    if (result.affectedRows > 0) {
        console.log(`${result.affectedRows} analyse(s) interrompue(s) marquée(s) en échec.`);
    }
};
