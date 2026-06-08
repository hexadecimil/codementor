<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

// Barre supérieure affichée uniquement sur mobile (< md), où la barre latérale
// est masquée. Elle reprend l'essentiel de la sidebar : retour aux projets
// (via le logo), nom d'utilisateur et déconnexion.
const auth = useAuthStore();
const router = useRouter();
const loggingOut = ref(false);

async function handleLogout() {
  loggingOut.value = true;
  try {
    await auth.logout();
    router.push("/login");
  } finally {
    loggingOut.value = false;
  }
}
</script>

<template>
  <header
    class="md:hidden sticky top-0 z-50 h-14 w-full bg-surface border-b border-line flex items-center justify-between px-4"
  >
    <!-- Logo : ramène à la liste des projets -->
    <RouterLink to="/projects" class="flex items-center gap-2">
      <div class="w-7 h-7 rounded bg-primary flex items-center justify-center text-background font-bold">C</div>
      <span class="text-lg font-black text-primary leading-none">CodeMentor</span>
    </RouterLink>

    <!-- Nom d'utilisateur + déconnexion -->
    <div class="flex items-center gap-3">
      <span class="text-sm text-muted truncate max-w-[140px]">
        {{ auth.user?.login || auth.user?.name || "Profil" }}
      </span>
      <button
        class="flex items-center text-danger hover:text-danger/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loggingOut"
        :aria-label="loggingOut ? 'Déconnexion en cours' : 'Se déconnecter'"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined text-[22px]">logout</span>
      </button>
    </div>
  </header>
</template>
