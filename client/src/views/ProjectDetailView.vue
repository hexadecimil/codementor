<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import AppLayout from "@/layouts/AppLayout.vue";
import StateMessage from "@/components/StateMessage.vue";
import { formatDate, formatDateTime, analysisLabel, statusInfo } from "@/utils/format";

const route = useRoute();
const router = useRouter();

const project = ref(null);
const loading = ref(true);
const error = ref("");
const starting = ref(false);

const breadcrumb = computed(() => [
  { label: "Projects", to: "/projects" },
  { label: project.value?.name || "…" },
]);

async function loadProject() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get(`/projects/${route.params.id}`);
    project.value = data;
  } catch {
    error.value = "Impossible de charger le projet.";
  } finally {
    loading.value = false;
  }
}

async function startAnalysis() {
  starting.value = true;
  try {
    const { data } = await api.post(`/projects/${route.params.id}/analyses`);
    router.push(`/analyses/${data.id}`);
  } catch {
    error.value = "Impossible de lancer l'analyse.";
    starting.value = false;
  }
}

onMounted(loadProject);
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb">
    <StateMessage v-if="loading" type="loading" message="Chargement du projet…" />
    <StateMessage v-else-if="error && !project" type="error" :message="error" />

    <template v-else-if="project">
      <!-- En-tête du projet -->
      <div class="bg-surface border border-line rounded-lg p-6 mb-6">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div class="min-w-0">
            <h1 class="text-2xl md:text-3xl font-bold text-ink mb-4 break-all">{{ project.name }}</h1>
            <div class="flex flex-wrap items-center gap-3 text-xs">
              <span v-if="project.github?.language" class="inline-flex items-center gap-1 h-7 px-2 rounded bg-blue-400/10 border border-blue-400/20 text-blue-400">
                <span class="w-2 h-2 rounded-full bg-blue-400"></span>{{ project.github.language }}
              </span>
              <span v-if="project.github" class="inline-flex items-center gap-1 h-7 px-2 rounded bg-white/5 border border-line text-muted">
                <span class="material-symbols-outlined text-[14px] leading-none">{{ project.github.visibility === "public" ? "public" : "lock" }}</span>
                {{ project.github.visibility === "public" ? "Public" : "Privé" }}
              </span>
              <span v-if="project.github" class="inline-flex items-center gap-1 h-7 px-2 rounded bg-white/5 border border-line text-muted">
                <span class="material-symbols-outlined text-[14px] leading-none">star</span>{{ project.github.stars }} Stars
              </span>
              <span v-if="project.github" class="text-muted">Créé le {{ formatDate(project.github.created_at) }}</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-3">
            <a
              :href="project.github_repo_url"
              target="_blank"
              rel="noopener"
              class="flex items-center justify-center gap-2 bg-transparent border border-line text-ink hover:bg-white/10 hover:border-muted px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <span class="material-symbols-outlined text-[18px]">open_in_new</span>
              Voir sur GitHub
            </a>
            <button
              :disabled="starting"
              class="flex items-center justify-center gap-2 bg-primary text-background hover:bg-[#157a4f] hover:text-white hover:scale-[1.03] px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:hover:scale-100"
              @click="startAnalysis"
            >
              <span class="material-symbols-outlined icon-fill text-[18px]">play_arrow</span>
              {{ starting ? "Lancement…" : "Lancer une analyse" }}
            </button>
          </div>
        </div>
      </div>

      <p v-if="error" class="text-sm text-danger mb-4">{{ error }}</p>

      <!-- Historique (colonne « Erreurs » retirée : non fournie par l'API liste) -->
      <div class="mb-6">
        <h2 class="text-xl font-bold text-ink mb-4">Historique des analyses</h2>

        <StateMessage v-if="project.analyses.length === 0" type="empty" message="Aucune analyse encore — lancez la première pour commencer." />

        <div v-else class="bg-surface border border-line rounded-lg overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-line bg-background">
                  <th class="p-4 font-mono text-xs text-muted font-medium">ID</th>
                  <th class="p-4 font-mono text-xs text-muted font-medium">Date</th>
                  <th class="p-4 font-mono text-xs text-muted font-medium">Statut</th>
                  <th class="p-4 font-mono text-xs text-muted font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody class="text-ink">
                <tr
                  v-for="a in project.analyses"
                  :key="a.id"
                  class="border-b border-line last:border-0 hover:bg-white/5 transition-colors cursor-pointer"
                  @click="router.push(`/analyses/${a.id}`)"
                >
                  <td class="p-4 font-mono text-xs">{{ analysisLabel(a.id) }}</td>
                  <td class="p-4 text-muted">{{ formatDateTime(a.analysis_date) }}</td>
                  <td class="p-4">
                    <span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs" :class="statusInfo(a.status).badge">
                      <span class="w-2 h-2 rounded-full" :class="statusInfo(a.status).dot"></span>
                      {{ statusInfo(a.status).label }}
                    </span>
                  </td>
                  <td class="p-4 text-right">
                    <RouterLink class="text-primary hover:underline text-sm" :to="`/analyses/${a.id}`" @click.stop>Consulter</RouterLink>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </AppLayout>
</template>
