import axios from "axios";

const httpClient = axios.create({ baseURL: "https://api.github.com" });

const parseRepoUrl = (repoUrl) => {
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) throw new Error(`URL de dépôt invalide : ${repoUrl}`);
    return { owner: match[1], repo: match[2] };
};

const authHeader = (token) => ({
    headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
    },
});

/**
 * Récupère l'arbre des fichiers d'un dépôt GitHub.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<object[]>}
 */
export const fetchRepoTree = async (repoUrl, token) => {
    const { owner, repo } = parseRepoUrl(repoUrl);

    const { data: repoInfo } = await httpClient.get(
        `/repos/${owner}/${repo}`,
        authHeader(token)
    );

    const { data: treeData } = await httpClient.get(
        `/repos/${owner}/${repo}/git/trees/${repoInfo.default_branch}?recursive=1`,
        authHeader(token)
    );

    return treeData.tree;
};

/**
 * Récupère le contenu (texte) d'un fichier d'un dépôt.
 * @param {string} repoUrl
 * @param {string} path
 * @param {string} token
 * @returns {Promise<string>}
 */
export const fetchFileContent = async (repoUrl, path, token) => {
    const { owner, repo } = parseRepoUrl(repoUrl);

    const { data } = await httpClient.get(
        `/repos/${owner}/${repo}/contents/${path}`,
        authHeader(token)
    );

    return Buffer.from(data.content, "base64").toString("utf-8");
};

/**
 * Vérifie que l'utilisateur a accès au dépôt avec son token.
 * @param {string} repoUrl
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export const checkRepoAccess = async (repoUrl, token) => {
    try {
        const { owner, repo } = parseRepoUrl(repoUrl);
        await httpClient.get(`/repos/${owner}/${repo}`, authHeader(token));
        return true;
    } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 403) {
            return false;
        }
        throw err;
    }
};

const RELEVANT_EXTENSIONS = [
    "js", "jsx", "ts", "tsx", "mjs", "cjs",
    "py", "java", "kt", "rb", "php", "go", "rs",
    "c", "cpp", "h", "hpp", "cs",
    "html", "css", "scss", "vue", "svelte",
    "json", "yml", "yaml", "sql",
];

const EXCLUDED_PATHS = [
    "node_modules/", "dist/", "build/", ".git/", "vendor/",
    "target/", "__pycache__/", ".next/", ".nuxt/", "coverage/",
];

/**
 * Filtre l'arbre pour ne retourner que les fichiers pertinents à analyser.
 * @param {object[]} tree
 * @returns {object[]}
 */
export const filterRelevantFiles = (tree) => {
    return tree.filter((entry) => {
        if (entry.type !== "blob") return false;
        if (EXCLUDED_PATHS.some((excluded) => entry.path.includes(excluded))) return false;

        const extension = entry.path.split(".").pop().toLowerCase();
        return RELEVANT_EXTENSIONS.includes(extension);
    });
};