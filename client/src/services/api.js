import axios from "axios";
import router from "@/router";
import { useAuthStore } from "@/stores/auth";

// Client HTTP unique pour toute l'application.
// - baseURL : préfixe de l'API backend, configurable via la variable d'env Vite VITE_API_URL.
//   Si la variable n'est pas définie, on retombe sur l'installation locale par défaut.
// - withCredentials : indispensable pour envoyer le cookie de session créé par
//   l'OAuth GitHub (sinon le backend répond 401 « Non connecté »).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/codementor/api",
  withCredentials: true,
});

// Intercepteur unique : stratégie de gestion d'erreur centralisée pour toute l'app.
// - 401 en cours d'usage (session expirée) : on vide l'état d'auth et on renvoie au
//   login. On ignore les routes /auth/* (un 401 sur /auth/me = « pas connecté », normal,
//   géré par le store) pour éviter toute boucle de redirection.
// - On normalise le message d'erreur à partir du corps renvoyé par le backend
//   ({ error } ou validation Joi { error, details }) pour que les vues puissent l'afficher.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";

    if (status === 401 && !url.includes("/auth/")) {
      useAuthStore().user = null;
      if (router.currentRoute.value.name !== "login") {
        router.push({ name: "login" });
      }
    }

    const data = error.response?.data;
    if (data?.error) {
      error.message = data.details?.length ? `${data.error} ${data.details[0]}` : data.error;
    }

    return Promise.reject(error);
  },
);

export default api;
