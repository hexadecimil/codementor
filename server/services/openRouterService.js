import axios from "axios";

const httpClient = axios.create({
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 120000,
});

const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

// Réduit le "thinking" (raisonnement interne facturé comme de la sortie) au minimum
// pour les modèles qui l'activent par défaut (ex: Gemini Flash) : grosse économie.
// On utilise effort:"low" car certains modèles (Gemini) REFUSENT enabled:false (erreur 400) ;
// effort:"low" est accepté et réduit fortement le raisonnement.
// Mettre AI_THINKING=true dans le .env pour laisser le modèle décider (raisonnement par défaut).
const REASONING = process.env.AI_THINKING === "true" ? {} : { reasoning: { effort: "low" } };

const ERROR_TYPES = ["syntax", "logic", "security", "performance", "style", "deprecation"];
const SEVERITIES = ["low", "medium", "high"];

const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en revue de code. On te fournit un fichier source et tu dois détecter ses erreurs et axes d'amélioration.

Réponds UNIQUEMENT avec un objet JSON valide (sans balises Markdown, sans texte autour) respectant exactement cette structure :

{
  "file_summary": "rôle du fichier en UNE phrase très courte (max ~12 mots)",
  "errors": [
    {
      "line_number": <entier>,
      "error_type": "syntax" | "logic" | "security" | "performance" | "style" | "deprecation",
      "severity": "low" | "medium" | "high",
      "description": "ce QU'EST le problème et POURQUOI c'en est un (ne propose PAS la solution ici)",
      "code_snippet": "extrait du code fautif",
      "suggested_fix": { "description": "COMMENT corriger, en une phrase courte (ne répète pas le code)", "suggested_code": "code corrigé" }
    }
  ]
}

Règles :
- "errors" est un tableau, vide [] si aucun problème.
- "error_type" DOIT être EXACTEMENT l'une de ces 6 valeurs, aucune autre : syntax, logic, security, performance, style, deprecation. N'invente jamais d'autre type (pas de "accessibility", "best-practice", "maintainability"…) : classe ces cas dans "style".
- "severity" DOIT valoir EXACTEMENT l'une de : low, medium, high.
- "suggested_fix" vaut null si aucune correction concrète n'est proposée.
- Rôles distincts à respecter : "description" décrit UNIQUEMENT le problème (le quoi + le pourquoi), sans donner la solution ; "suggested_fix.description" décrit UNIQUEMENT la correction. Ne mélange pas les deux et ne répète pas dans la description du fix ce que montre déjà "suggested_code".
- Sois concis : pas de phrases de remplissage, va à l'essentiel. "file_summary" tient en une seule phrase très courte.
- Ne signale que de vrais problèmes, n'invente rien.
- Toutes les descriptions sont en français.
- Les lignes te sont fournies préfixées de "<numéro>│" pour repérer line_number ; ce préfixe ne fait PAS partie du code.

À propos des versions (actions GitHub, Node, dépendances npm, images Docker…) :
- Ta connaissance des versions s'arrête à ta date d'entraînement. Tu ne peux donc PAS savoir si une version récente est "la dernière", "obsolète", "instable" ou "non maintenue". Ne te fonde JAMAIS sur la fraîcheur supposée d'une version, et ne propose jamais de revenir à une version plus ancienne (downgrade) parce que tu ne reconnais pas un numéro récent.
- Ne signale un problème de version QUE si tu peux citer une raison concrète et vérifiable, indépendante de la date : une faille de sécurité connue et précise (CVE), une API réellement supprimée/dépréciée que ce code utilise, ou une incompatibilité technique démontrable dans le code fourni. Dans ce cas, explique la raison précise, n'invente pas un numéro de version "correct".

Évite le bruit :
- Ne signale pas ce qui est volontaire et idiomatique : catch sans variable (catch {}), commentaires eslint-disable explicites, valeur de retour volontairement ignorée, IIFE async.
- Ne crée jamais une entrée pour conclure qu'il n'y a finalement pas de problème. En cas de doute sur la réalité d'un problème, ne le signale pas.

Certitude obligatoire (ne JAMAIS spéculer) :
- Ne signale un problème QUE si tu es certain qu'il provoque un vrai bug, une vraie faille, ou un vrai dysfonctionnement. Si ton raisonnement repose sur une SUPPOSITION concernant le format, le schéma, la spécification ou la sémantique d'un outil, d'un mod, d'une bibliothèque ou d'un framework que tu ne connais pas avec certitude, NE LE SIGNALE PAS.
- N'écris jamais "provoquera une exception/une erreur" pour une simple hypothèse. Si tu n'es pas sûr, ne signale rien.
- Pour les fichiers de configuration ou de données (JSON, YAML, TOML…) propres à un outil ou un mod tiers : tu ne connais pas forcément leur schéma exact. Ne juge leur validité que sur des règles UNIVERSELLES et certaines (par ex. la syntaxe JSON/YAML de base), jamais sur des conventions de nommage, des identifiants attendus, ou des règles internes que tu supposes.
- RÈGLE STRICTE pour ces fichiers de config/données tiers : tu n'as PAS le droit d'affirmer qu'une valeur est invalide, qu'un identifiant/biome/nom n'existe pas, ni qu'une règle logique (ET/OU, ordre des éléments, casse, présence d'un namespace/préfixe) s'applique — tu ne connais pas le schéma de cet outil. Limite-toi STRICTEMENT aux erreurs de syntaxe du format lui-même (JSON/YAML mal formé : virgule manquante, accolade/crochet non fermé, commentaire dans du JSON strict). Pour tout le reste sur ces fichiers : ne signale rien.

Sévérité :
- "high" : bug avéré, faille de sécurité, ou code qui plantera / produira un résultat faux.
- "medium" : vrai défaut de logique ou de robustesse, sans plantage immédiat.
- "low" : uniquement si cela affecte un comportement réel du code (un cas limite qui peut réellement se produire). Ne signale PAS une simple bonne pratique, convention ou préférence d'outillage qui n'a pas d'impact concret sur l'exécution (ex: "npm ci plutôt que npm install"). En cas de doute, ne le signale pas.`;

const numberLines = (content) => {
    return content
        .split("\n")
        .map((line, i) => `${i + 1}│${line}`)
        .join("\n");
};

/**
 * Appelle l'API OpenRouter et retourne le contenu texte de la réponse.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} [extraOptions] Options ajoutées au corps (ex: response_format).
 * @returns {Promise<string>}
 */
const chatCompletion = async (messages, extraOptions = {}) => {
    const { data } = await httpClient.post(
        "/chat/completions",
        { model: MODEL, temperature: 0.2, messages, ...REASONING, ...extraOptions },
        { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` } }
    );

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
        throw new Error("Réponse OpenRouter vide ou inattendue");
    }
    return content;
};

/**
 * Normalise une erreur renvoyée par le LLM pour respecter les contraintes BDD
 * (ENUM et colonnes NOT NULL) ; retourne null si l'erreur est inexploitable.
 * @param {object} error
 * @returns {object|null}
 */
const normalizeError = (error) => {
    if (!error || !error.description) return null;

    return {
        line_number: Number.isInteger(error.line_number) ? error.line_number : null,
        error_type: ERROR_TYPES.includes(error.error_type) ? error.error_type : "style",
        severity: SEVERITIES.includes(error.severity) ? error.severity : "medium",
        description: String(error.description),
        code_snippet: error.code_snippet ?? null,
        suggested_fix: error.suggested_fix ?? null,
    };
};

/**
 * Envoie le contenu d'un fichier au LLM et retourne son résumé et ses erreurs
 * détectées (normalisées), chacune avec une correction suggérée (0..1).
 * @param {{path: string, content: string, language: string}} file
 * @returns {Promise<{file_summary: string, errors: object[]}>}
 */
export const analyzeFile = async (file) => {
    const userPrompt = `Fichier : ${file.path}
Langage : ${file.language}

Contenu :
${numberLines(file.content)}`;

    const raw = await chatCompletion(
        [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
        ],
        { response_format: { type: "json_object" } }
    );

    // Le modèle entoure parfois le JSON de balises ```json … ``` malgré la
    // consigne : on isole l'objet entre la première { et la dernière }.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");

    let parsed;
    try {
        parsed = JSON.parse(raw.slice(start, end + 1));
    } catch {
        throw new Error(`Réponse LLM non parsable pour ${file.path}`);
    }

    return {
        file_summary: parsed.file_summary ?? "",
        errors: (parsed.errors ?? []).map(normalizeError).filter(Boolean),
    };
};

/**
 * Demande au LLM un diagramme Mermaid à partir de la structure du projet.
 * @param {Array<{path: string}>} structure
 * @returns {Promise<string>}
 */
export const generateMermaid = async (structure) => {
    // Pour le diagramme d'architecture, on écarte les fichiers de données/config
    // (souvent des centaines de .json/.yml) qui noieraient le schéma. On les garde
    // pour l'analyse, mais pas pour la vue d'ensemble structurelle.
    const EXCLUDE = /\/config\/|\.(json|ya?ml|toml|lock|md|txt|properties|cfg)$/i;
    const codeFiles = structure.filter((file) => !EXCLUDE.test(file.path));
    // Si le projet n'a que de la config, on retombe sur la liste complète.
    const files = codeFiles.length > 0 ? codeFiles : structure;
    // On fournit le chemin ET le résumé de chaque fichier : avec l'instruction sur
    // les acteurs externes ci-dessous, les résumés permettent un diagramme plus précis
    // (services nommés individuellement, relations fines). Cf. tests §12 du journal.
    const fileList = files
        .map((file) => `- ${file.path}${file.summary ? ` : ${file.summary}` : ""}`)
        .join("\n");

    const systemPrompt = `Tu génères un diagramme Mermaid de HAUT NIVEAU décrivant l'ARCHITECTURE d'un projet à partir de sa liste de fichiers de code (chemin + rôle).

Règles :
- Regroupe les fichiers par DOSSIER ou par MODULE/COUCHE logique (ex: controllers, services, models, routes, components). Ne crée PAS un nœud par fichier.
- Représente les relations principales entre ces groupes, pas chaque fichier individuel.
- Ajoute AUSSI les acteurs/systèmes externes que tu peux déduire de l'architecture : la base de données (si tu vois des repositories/entités JPA), le client/frontend (si tu vois des controllers/API REST), les services externes (Docker, API tierces…). Représente-les comme des nœuds distincts reliés aux couches concernées.
- Limite-toi à 25 nœuds maximum. Si le projet est plus gros, regroupe davantage au niveau des dossiers principaux.
- Utilise "graph LR" (de gauche à droite) pour un rendu compact et lisible.
- Tu peux utiliser des subgraph pour grouper visuellement (ex: subgraph Backend, subgraph Frontend).
- IMPORTANT (sinon le diagramme est invalide) : chaque identifiant doit être UNIQUE. N'utilise JAMAIS le même nom pour un subgraph et pour un nœud (ex: ne pas avoir "subgraph Controller" ET un nœud "Controller"). Les flèches (-->) doivent relier des NŒUDS entre eux, jamais un subgraph.

Réponds UNIQUEMENT avec le code Mermaid (commençant par "graph LR"), sans balises Markdown ni texte autour.`;

    const content = await chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Fichiers du projet :\n${fileList}` },
    ]);

    return content.trim();
};

/**
 * Demande au LLM une vue d'ensemble du projet à partir des résumés de fichiers.
 * @param {Array<{path: string, summary: string}>} structure
 * @returns {Promise<string>}
 */
export const generateOverview = async (structure) => {
    const fileList = structure
        .map((file) => `- ${file.path}${file.summary ? ` : ${file.summary}` : ""}`)
        .join("\n");

    const systemPrompt = `Tu es un expert en revue de code. À partir de la liste des fichiers d'un projet et de leur résumé, rédige une vue d'ensemble concise (3 à 5 phrases, en français) décrivant le rôle global du projet, son architecture et ses points notables. Réponds uniquement avec le texte, sans Markdown.`;

    const content = await chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Fichiers du projet :\n${fileList}` },
    ]);

    return content.trim();
};
