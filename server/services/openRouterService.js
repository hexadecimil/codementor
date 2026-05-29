import axios from "axios";

const httpClient = axios.create({ baseURL: "https://openrouter.ai/api/v1" });

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en revue de code. On te fournit un fichier source et tu dois détecter ses erreurs et axes d'amélioration.

Réponds UNIQUEMENT avec un objet JSON valide (sans balises Markdown, sans texte autour) respectant exactement cette structure :

{
  "file_summary": "résumé concis du rôle du fichier (2-3 phrases)",
  "errors": [
    {
      "line_number": <entier>,
      "error_type": "syntax" | "logic" | "security" | "performance" | "style" | "deprecation",
      "severity": "low" | "medium" | "high",
      "description": "explication claire du problème",
      "code_snippet": "extrait du code fautif",
      "suggested_fix": { "description": "explication de la correction", "suggested_code": "code corrigé" }
    }
  ]
}

Règles :
- "errors" est un tableau, vide [] si aucun problème.
- "error_type" DOIT être EXACTEMENT l'une de ces 6 valeurs, aucune autre : syntax, logic, security, performance, style, deprecation. N'invente jamais d'autre type (pas de "accessibility", "best-practice", "maintainability"…) : classe ces cas dans "style".
- "severity" DOIT valoir EXACTEMENT l'une de : low, medium, high.
- "suggested_fix" vaut null si aucune correction concrète n'est proposée.
- Ne signale que de vrais problèmes, n'invente rien.
- Toutes les descriptions sont en français.
- Les lignes te sont fournies préfixées de "<numéro>│" pour repérer line_number ; ce préfixe ne fait PAS partie du code.`;

const numberLines = (content) => {
    return content
        .split("\n")
        .map((line, i) => `${i + 1}│${line}`)
        .join("\n");
};

/**
 * Envoie le contenu d'un fichier au LLM et retourne l'analyse complète :
 * résumé du fichier, erreurs détectées et correction suggérée (0..1 par erreur).
 *
 * @param {object} file
 * @param {string} file.path
 * @param {string} file.content
 * @param {string} file.language
 * @returns {Promise<{
 *   file_summary: string,
 *   errors: Array<{
 *     line_number: number,
 *     error_type: string,
 *     severity: string,
 *     description: string,
 *     code_snippet: string,
 *     suggested_fix: { description: string, suggested_code: string } | null
 *   }>
 * }>}
 */
export const analyzeFile = async (file) => {
    const userPrompt = `Fichier : ${file.path}
Langage : ${file.language}

Contenu :
${numberLines(file.content)}`;

    const { data } = await httpClient.post(
        "/chat/completions",
        {
            model: MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
                { role: "user", content: userPrompt },
            ],
        },
        { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    const raw = data.choices[0].message.content;

    // Haiku entoure parfois le JSON de balises ```json … ``` malgré la consigne :
    // on isole l'objet entre la première { et la dernière }.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    let parsed;
    try {
        parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
        console.error(`Brut LLM (${file.path}):`, raw);
        throw new Error(`Réponse LLM non parsable pour ${file.path}`);
    }

    return {
        file_summary: parsed.file_summary ?? "",
        errors: parsed.errors ?? [],
    };
};

/**
 * Demande au LLM un diagramme Mermaid à partir de la structure du projet.
 * @param {object} structure
 * @returns {Promise<string>}
 */
export const generateMermaid = async (structure) => {
    const fileList = structure.map((file) => `- ${file.path}`).join("\n");

    const systemPrompt = `Tu génères un diagramme Mermaid décrivant la structure 
    d'un projet à partir de sa liste de fichiers. Réponds UNIQUEMENT avec le code Mermaid
     (commençant par "graph TD"), sans balises Markdown ni texte autour.`;

    const { data } = await httpClient.post(
        "/chat/completions",
        {
            model: MODEL,
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Fichiers du projet :\n${fileList}` },
            ],
        },
        { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    return data.choices[0].message.content.trim();
};
