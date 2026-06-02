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

const ANALYSIS_SYSTEM_PROMPT = `Tu es un expert en revue de code. On te donne UN seul fichier et tu y détectes les VRAIS bugs.

# Règle d'or
Ne signale un problème QUE si tu peux le PROUVER avec le code visible dans ce fichier. Le doute profite au code : si tu n'es pas certain, ne signale rien. Un fichier sans bug réel est normal — renvoie une liste vide plutôt que de la remplir.

Un "vrai bug" = le code plante, produit un résultat faux, ou ouvre une faille de sécurité, de façon certaine et reproductible.

# Ne signale JAMAIS (sources de faux positifs)
- Style, lisibilité, accessibilité, responsive, conventions de nommage, optimisations mineures, ou problèmes "potentiels/possibles" non démontrés. Si le code fonctionne, laisse-le.
- Ce qui dépend d'un AUTRE fichier : tu ne vois que ce fichier-ci. Donc pas d'"import manquant" (la classe peut être dans le même package — en Java, même package = aucun import requis), pas de "variable/fonction non définie", pas de symbole "introuvable".
- Un cas null/undefined DÉJÀ protégé sur la ligne : si tu vois \`x?.y\`, \`x || défaut\`, \`x ?? z\`, ou \`if (x != null)\`, le cas est géré → ne le signale pas.
- Une API de bibliothèque tierce (Stripe, Docker, frameworks…) que tu juges "mal utilisée" ou "qui retournera null" : tu ignores la signature exacte de sa version → abstiens-toi.
- Les VERSIONS (dépendances, actions, images, runtime) : tu ne sais pas ce qui existe après ta date d'entraînement. Ne dis jamais qu'une version est obsolète/instable, ne propose pas de downgrade. Exception : une CVE précise et connue, ou une API réellement supprimée utilisée ici.
- Une balise auto-fermée par \`/>\` (ex: \`<path ... />\`, \`<img ... />\`) ou close par \`</...>\` : elle EST bien fermée, même si son contenu est très long. Ne l'accuse pas d'être "non fermée".
- Les commentaires \`//\` ou \`/* */\` dans tsconfig.json, jsconfig.json, .vscode/*.json ou tout .jsonc : c'est AUTORISÉ, ce n'est pas une erreur.
- Fichiers de config/données d'un outil tiers (JSON/YAML/TOML de mods, etc.) : juge seulement la syntaxe du format (accolade/virgule manquante, commentaire dans du JSON strict), jamais la validité d'une valeur, d'un identifiant ou d'une règle interne dont tu ignores le schéma.
- Code idiomatique volontaire : catch sans variable, eslint-disable, valeur de retour ignorée, IIFE async.

# Méthode (avant chaque entrée)
Recopie le code fautif EXACT dans "code_snippet", puis vérifie que ta "description" est cohérente avec ce que montre ce snippet. Si le snippet ne prouve pas ce que tu affirmes, supprime l'entrée.

# Sévérité
- high : plante ou produit un résultat faux à coup sûr, ou faille de sécurité.
- medium : vrai défaut de logique/robustesse atteignable dans un cas réel.
- low : vrai petit bug à impact réel mais mineur (jamais du style).

# Format de sortie
Réponds UNIQUEMENT par un objet JSON valide, sans Markdown ni texte autour :

{
  "file_summary": "rôle du fichier en une phrase très courte (max ~12 mots)",
  "errors": [
    {
      "line_number": <entier>,
      "error_type": "syntax" | "logic" | "security" | "performance" | "style" | "deprecation",
      "severity": "low" | "medium" | "high",
      "description": "le problème et pourquoi, sans la solution",
      "code_snippet": "extrait exact, 1 à 2 lignes max",
      "suggested_fix": { "description": "comment corriger, une phrase, sans répéter le code", "suggested_code": "code corrigé, court" }
    }
  ]
}

Contraintes :
- "error_type" : exactement l'une des 6 valeurs (cas limite → "style"). "severity" : exactement low/medium/high.
- "suggested_fix" vaut null si aucune correction concrète.
- "code_snippet" et "suggested_code" : 1 à 2 lignes MAX. N'inclus jamais un gros bloc HTML/SVG/CSS ni une longue chaîne pleine de guillemets (abrège avec …) — cela casserait le JSON.
- "description" = le problème, "suggested_fix.description" = la correction : ne les mélange pas, ne répète pas le code.
- Tout en français, concis, sans remplissage.
- Les lignes te sont fournies préfixées de "<numéro>│" pour repérer line_number ; ce préfixe ne fait PAS partie du code.`;

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
