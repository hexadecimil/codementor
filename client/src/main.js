import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import "@/assets/styles.css";

const app = createApp(App);

// Barrière d'erreur globale : toute exception non gérée dans le rendu ou un hook
// de composant est journalisée ici, au lieu de casser silencieusement l'affichage.
app.config.errorHandler = (err, instance, info) => {
  console.error("Erreur Vue non gérée :", err, info);
};

app.use(createPinia()); // le store (Pinia)
app.use(router);

app.mount("#app");
