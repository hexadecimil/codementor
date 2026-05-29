import {
  getAuthorizationUrl,
  exchangeCode,
  fetchGitHubUser,
  createOrUpdateUser,
  findUserById,
} from "../services/authService.js";

/**
 * Redirige l'utilisateur vers la page d'autorisation GitHub OAuth.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = (req, res) => {
  const url = getAuthorizationUrl();
  res.redirect(url);
};

/**
 * Callback OAuth : échange le code contre un token, récupère le profil GitHub
 * et crée/met à jour l'utilisateur, puis ouvre la session.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const callback = async (req, res) => {
  const { code } = req.query;
  const token = await exchangeCode(code);

  const githubUser = await fetchGitHubUser(token);

  const user = { github_id: githubUser.id, access_token: token };

  const dbUser = await createOrUpdateUser(user);

  req.session.userId = dbUser.id;
  req.session.githubToken = token;

  res.redirect("http://localhost:5173/dashboard");
};

/**
 * Détruit la session courante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
};

/**
 * Retourne l'utilisateur de la session courante.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
export const getCurrentUser = async (req, res) => {
  const userId = req.session.userId;

  const user = await findUserById(userId);

  if (!user) {
    return res.status(404).json({ error: "Utilisateur introuvable" });
  }
  const { access_token, ...safeUser } = user;
  
  res.json(safeUser);
};
