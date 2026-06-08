// Petites fonctions d'affichage partagées par les vues.

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-CH", { dateStyle: "short", timeStyle: "short" });
}

export function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-CH");
}

// Date relative simple (ex: "il y a 2 j").
export function relativeDate(value) {
  if (!value) return "";
  const diff = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  const days = Math.floor(diff / 86400);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an(s)`;
}

// Extrait { owner, repo } d'une URL de dépôt GitHub, ou null si l'URL n'en est pas une.
// Source unique utilisée à la fois pour valider la saisie et pour l'affichage.
// L'hôte doit être github.com (empêche une URL usurpée comme evil.com/github.com/...),
// et l'URL doit contenir au moins « propriétaire/dépôt ».
export function parseGithubRepo(url) {
  const match = (url || "")
    .trim()
    .match(/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:[/?#].*)?$/i);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

// Nom complet d'un dépôt « pseudo/repo » extrait de son URL GitHub.
// Le backend ne renvoie que le nom du repo ; on récupère le propriétaire depuis l'URL.
export function repoFullName(url) {
  const repo = parseGithubRepo(url);
  return repo ? `${repo.owner}/${repo.repo}` : url || "";
}

// Identifiant d'analyse au format des maquettes (ex: #ANL-042).
export function analysisLabel(id) {
  return `#ANL-${String(id).padStart(3, "0")}`;
}

// --- Statuts d'analyse : libellé + classes de couleur ---
const STATUS = {
  queued: { label: "En attente", badge: "bg-blue-400/10 text-blue-400 border border-blue-400/20", dot: "bg-blue-400" },
  running: { label: "En cours", badge: "bg-blue-400/10 text-blue-400 border border-blue-400/20", dot: "bg-blue-400" },
  completed: { label: "Succès", badge: "bg-primary/10 text-primary border border-primary/20", dot: "bg-primary" },
  failed: { label: "Échec", badge: "bg-danger/10 text-danger border border-danger/20", dot: "bg-danger" },
};

// Libellé + classes de couleur (badge, point) d'un statut ; valeur neutre si inconnu.
export function statusInfo(status) {
  return STATUS[status] || { label: status, badge: "bg-white/5 text-muted border border-line", dot: "bg-muted" };
}

// --- Sévérités d'erreur : libellé + couleurs ---
const SEVERITY = {
  high: { label: "Élevée", icon: "error", iconColor: "text-danger", badge: "bg-danger/10 text-danger border border-danger/20", border: "border-danger/30" },
  medium: { label: "Moyenne", icon: "warning", iconColor: "text-amber-400", badge: "bg-amber-400/10 text-amber-400 border border-amber-400/20", border: "border-line" },
  low: { label: "Faible", icon: "info", iconColor: "text-primary", badge: "bg-primary/10 text-primary border border-primary/20", border: "border-line" },
};

// Libellé + icône + classes de couleur d'une sévérité ; « moyenne » par défaut si inconnue.
export function severityInfo(severity) {
  return SEVERITY[severity] || SEVERITY.medium;
}

// Libellés français des types d'erreur renvoyés par le backend.
export const ERROR_TYPE_LABELS = {
  syntax: "Syntaxe",
  logic: "Logique",
  security: "Sécurité",
  performance: "Performance",
  style: "Style",
  deprecation: "Obsolescence",
};
