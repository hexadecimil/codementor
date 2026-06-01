import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "@/App.vue";
import router from "@/router";
import "@/assets/styles.css";

const app = createApp(App);

app.use(createPinia()); // le store (Pinia)
app.use(router);

app.mount("#app");
