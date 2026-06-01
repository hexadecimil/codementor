<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import AppLayout from "@/layouts/AppLayout.vue";

const router = useRouter();

const url = ref("");
const submitting = ref(false);
const error = ref("");

const isValid = computed(() => /github\.com\/.+\/.+/.test(url.value.trim()));

function messageFor(status) {
  if (status === 400) return "URL de dépôt invalide.";
  if (status === 403) return "Accès au dépôt refusé. Vérifiez vos droits sur GitHub.";
  if (status === 404) return "Dépôt introuvable.";
  if (status === 409) return "Ce dépôt est déjà enregistré.";
  return "Une erreur est survenue. Réessayez.";
}

async function submit() {
  if (!isValid.value) return;
  error.value = "";
  submitting.value = true;
  try {
    const { data } = await api.post("/projects", { github_repo_url: url.value.trim() });
    router.push(`/projects/${data.id}`);
  } catch (err) {
    error.value = messageFor(err.response?.status);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <AppLayout :breadcrumb="[{ label: 'Projects', to: '/projects' }, { label: 'Nouveau projet' }]">
    <div class="flex justify-center pt-8">
      <div class="bg-surface border border-line rounded-xl w-full max-w-2xl overflow-hidden">
        <!-- En-tête -->
        <div class="px-6 py-5 border-b border-line">
          <h2 class="text-2xl font-bold text-ink">Ajouter un projet</h2>
          <p class="text-sm text-muted mt-1">Collez le lien du dépôt GitHub à analyser</p>
        </div>

        <!-- Formulaire -->
        <form class="p-6 space-y-4" @submit.prevent="submit">
          <div class="space-y-2">
            <label class="text-sm font-medium text-ink" for="github-url">Lien du dépôt GitHub</label>
            <div class="relative flex items-center">
              <span class="material-symbols-outlined absolute left-3 text-muted text-[20px]">link</span>
              <input
                id="github-url"
                v-model="url"
                class="w-full bg-background border border-line rounded-lg py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:border-primary transition-all"
                placeholder="https://github.com/utilisateur/nom-du-depot"
                type="url"
              />
            </div>
            <p class="text-xs text-muted">Format : https://github.com/username/repository</p>
          </div>

          <p v-if="error" class="text-sm text-danger">{{ error }}</p>

          <!-- Actions -->
          <div class="pt-4 border-t border-line flex justify-end gap-3 items-center">
            <RouterLink
              to="/projects"
              class="px-4 py-2 rounded-lg text-sm text-ink hover:bg-white/10 border border-transparent hover:border-line transition-colors"
            >
              Annuler
            </RouterLink>
            <button
              type="submit"
              :disabled="!isValid || submitting"
              class="px-4 py-2 rounded-lg text-sm font-bold bg-primary text-background hover:bg-[#157a4f] hover:text-white hover:scale-[1.03] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
              {{ submitting ? "Ajout en cours…" : "Ajouter le projet" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
