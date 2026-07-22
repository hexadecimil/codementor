// Extrait l'extension d'un chemin de fichier, en minuscules.
export const getExtension = (filePath) => filePath.split(".").pop().toLowerCase();

// Correspondance extension -> nom de langage pour les langages courants.
const LANGUAGE_BY_EXTENSION = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  ts: "typescript",
  tsx: "typescript",
  py: "python",
  java: "java",
  kt: "kotlin",
  rb: "ruby",
  php: "php",
  go: "go",
  rs: "rust",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  html: "html",
  css: "css",
  scss: "scss",
  vue: "vue",
  svelte: "svelte",
  json: "json",
  yml: "yaml",
  yaml: "yaml",
  sql: "sql",
};

/**
 * Déduit le nom du langage d'un fichier d'après son extension.
 * @param {string} filePath
 * @returns {string} Le nom du langage, ou l'extension si elle est inconnue.
 */
export const detectLanguage = (filePath) => {
  const extension = getExtension(filePath);
  return LANGUAGE_BY_EXTENSION[extension] ?? extension;
};
