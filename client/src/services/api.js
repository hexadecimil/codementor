import axios from "axios";

// Client HTTP unique pour toute l'application.
// - baseURL : préfixe de l'API backend (voir server/server.js).
// - withCredentials : indispensable pour envoyer le cookie de session créé par
//   l'OAuth GitHub (sinon le backend répond 401 « Non connecté »).
const api = axios.create({
  baseURL: "http://localhost:3000/codementor/api",
  withCredentials: true,
});

export default api;
