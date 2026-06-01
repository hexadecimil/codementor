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
    login() {
      window.location.href = "http://localhost:3000/codementor/api/auth/login";
    },

    async logout() {
      await api.post("/auth/logout");
      this.user = null;
    },
  },
});
