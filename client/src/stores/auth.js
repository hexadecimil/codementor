import { defineStore } from "pinia";
import api from "@/services/api";

// Store d'authentification.
// Il garde l'utilisateur connecté en mémoire et sait interroger le backend.
export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null, // { id, login, name, avatar_url } ou null si non connecté
    ready: false, // passe à true une fois le premier fetchMe() terminé
  }),

  getters: {
    isLoggedIn: (state) => state.user !== null,
  },

  actions: {
    // Demande au backend qui est l'utilisateur courant (via le cookie de session).
    // Un 401 signifie simplement « pas connecté » : on met user à null sans planter.
    async fetchMe() {
      try {
        const { data } = await api.get("/auth/me");
        this.user = data;
      } catch {
        this.user = null;
      } finally {
        this.ready = true;
      }
    },

    // Démarre la connexion OAuth GitHub. Il faut une vraie navigation du navigateur
    // (pas un fetch) car le backend renvoie une redirection vers GitHub.
    // On réutilise la même base d'URL que l'API (variable d'env unique).
    login() {
      window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:3000/codementor/api"}/auth/login`;
    },

    // On vide toujours l'état local, même si l'appel échoue (réseau, 500), pour ne
    // jamais laisser l'utilisateur « connecté » côté interface après une déconnexion.
    async logout() {
      try {
        await api.post("/auth/logout");
      } finally {
        this.user = null;
      }
    },
  },
});
