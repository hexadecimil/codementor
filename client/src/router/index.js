import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

import LoginView from "@/views/LoginView.vue";
import ProjectsView from "@/views/ProjectsView.vue";
import AddProjectView from "@/views/AddProjectView.vue";
import ProjectDetailView from "@/views/ProjectDetailView.vue";
import AnalysisView from "@/views/AnalysisView.vue";

const routes = [
  { path: "/login", name: "login", component: LoginView, meta: { public: true, title: "Connexion" } },
  { path: "/", redirect: "/projects" },
  // Le backend redirige vers /dashboard après l'OAuth : on le renvoie vers les projets.
  { path: "/dashboard", redirect: "/projects" },
  { path: "/projects", name: "projects", component: ProjectsView, meta: { title: "Mes projets" } },
  { path: "/projects/new", name: "project-new", component: AddProjectView, meta: { title: "Nouveau projet" } },
  { path: "/projects/:id", name: "project-detail", component: ProjectDetailView, meta: { title: "Projet" } },
  { path: "/analyses/:id", name: "analysis", component: AnalysisView, meta: { title: "Analyse" } },
  // Toute URL inconnue est renvoyée vers les projets (évite une page blanche).
  { path: "/:pathMatch(.*)*", redirect: "/projects" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Garde globale : on s'assure de connaître l'état de connexion avant chaque page.
router.beforeEach(async (to) => {
  const auth = useAuthStore();

  // Au premier chargement, on demande au backend qui est connecté.
  if (!auth.ready) {
    await auth.fetchMe();
  }

  // Page privée + non connecté -> on renvoie vers la connexion.
  if (!to.meta.public && !auth.isLoggedIn) {
    return { name: "login" };
  }

  // Déjà connecté mais sur la page de login -> on va aux projets.
  if (to.name === "login" && auth.isLoggedIn) {
    return { name: "projects" };
  }

  return true;
});

// Met à jour le titre de l'onglet selon la page courante.
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · CodeMentor` : "CodeMentor";
});

export default router;
