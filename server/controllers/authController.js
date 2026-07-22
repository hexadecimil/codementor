import {
  getAuthorizationUrl,
  exchangeCode,
  fetchGitHubUser,
  createOrUpdateUser,
  findUserById,
  getUserToken,
} from "../services/authService.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Redirige l'utilisateur vers la page d'autorisation GitHub OAuth.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = asyncHandler(async (req, res) => {
  const url = getAuthorizationUrl();
  res.redirect(url);
});

/**
 * Callback OAuth : échange le code contre un token, récupère le profil GitHub
 * et crée/met à jour l'utilisateur, puis ouvre la session.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const callback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  if (!code) {
    throw new AppError("Code d'autorisation manquant", 400);
  }
  const token = await exchangeCode(code);

  const githubUser = await fetchGitHubUser(token);

  const dbUser = await createOrUpdateUser({
    github_id: githubUser.id,
    access_token: token,
  });

  // Seul l'id utilisateur est gardé en session ; le token reste chiffré en BDD.
  req.session.userId = dbUser.id;

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  res.redirect(`${frontendUrl}/dashboard`);
});

/**
 * Détruit la session courante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.sendStatus(204);
  });
};

/**
 * Retourne l'utilisateur de la session courante, enrichi de son profil GitHub
 * (login, nom, avatar) récupéré en direct via son token.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await findUserById(req.session.userId);

  if (!user) {
    throw new AppError("Utilisateur introuvable", 404);
  }

  // Profil GitHub récupéré en direct. On ne capture pas l'erreur ici : si le token
  // est invalide, le 401 remonte au client, qui déclenche alors la reconnexion.
  const token = await getUserToken(req.session.userId);
  const githubProfile = await fetchGitHubUser(token);

  res.json({
    id: user.id,
    github_id: user.github_id,
    created_at: user.created_at,
    login: githubProfile?.login ?? null,
    name: githubProfile?.name ?? null,
    avatar_url: githubProfile?.avatar_url ?? null,
  });
});
