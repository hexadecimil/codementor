<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
  <nav class="hidden md:flex fixed left-0 top-0 h-full w-[240px] flex-col py-6 border-r border-line bg-surface z-50">
    <!-- Logo -->
    <div class="px-6 mb-8 flex items-center gap-3">
      <div class="w-8 h-8 rounded bg-primary flex items-center justify-center text-background font-bold text-xl">C</div>
      <div>
        <div class="text-xl font-black text-primary leading-none">CodeMentor</div>
        <div class="text-xs text-muted font-mono mt-1">Outil d'analyse par IA</div>
      </div>
    </div>

    <!-- Navigation (Settings retiré) -->
    <ul class="flex-1 px-2 space-y-1">
      <li>
        <RouterLink
          to="/projects"
          class="flex items-center gap-3 px-4 py-2 rounded-lg text-muted hover:text-ink hover:bg-white/10 transition-colors"
          active-class="bg-white/5! text-primary! font-bold"
        >
          <span class="material-symbols-outlined text-[20px]">folder</span>
          <span class="text-sm">Projets</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Bas : profil + déconnexion -->
    <div class="mt-auto px-2 border-t border-line pt-4 space-y-1">
      <div class="flex items-center gap-3 px-4 py-2 text-muted">
        <span class="material-symbols-outlined text-[20px]">account_circle</span>
        <span class="text-sm truncate">{{ auth.user?.login || auth.user?.name || "Profil" }}</span>
      </div>
      <button
        class="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-danger hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="loggingOut"
        @click="handleLogout"
      >
        <span class="material-symbols-outlined text-[20px]">logout</span>
        <span class="text-sm">{{ loggingOut ? "Déconnexion…" : "Déconnexion" }}</span>
      </button>
    </div>
  </nav>
</template>
