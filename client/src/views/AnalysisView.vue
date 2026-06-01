<script setup>
import { ref, computed, watch, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api from "@/services/api";
import AppLayout from "@/layouts/AppLayout.vue";
import StateMessage from "@/components/StateMessage.vue";
import ErrorItem from "@/components/ErrorItem.vue";
import MermaidDiagram from "@/components/MermaidDiagram.vue";
import { formatDate, analysisLabel } from "@/utils/format";

const route = useRoute();
const router = useRouter();

const analysis = ref(null);
const progress = ref(0);
const loading = ref(true);
const error = ref("");
const mainLanguage = ref("—");
const projectName = ref("");
const restarting = ref(false);

let pollTimer = null;

const isRunning = computed(() => analysis.value?.status === "queued" || analysis.value?.status === "running");

const allErrors = computed(() => {
  if (!analysis.value?.files) return [];
  return analysis.value.files.flatMap((file) => file.errors.map((e) => ({ error: e, filePath: file.file_path })));
});

const errorCount = computed(() => allErrors.value.length);

const counts = computed(() => {
  const c = { high: 0, medium: 0, low: 0 };
  allErrors.value.forEach((i) => {
    if (c[i.error.severity] !== undefined) c[i.error.severity] += 1;
  });
  return c;
});

// Filtre par sévérité : null = tout afficher, sinon "high"/"medium"/"low".
// On clique sur un label pour ne garder que cette sévérité ; re-cliquer enlève le filtre.
const severityFilter = ref(null);

function toggleFilter(severity) {
  severityFilter.value = severityFilter.value === severity ? null : severity;
}

const visibleErrors = computed(() => {
  if (!severityFilter.value) return allErrors.value;
  return allErrors.value.filter((i) => i.error.severity === severityFilter.value);
});

const breadcrumb = computed(() => [
  { label: "Projects", to: "/projects" },
  { label: projectName.value || "…", to: analysis.value ? `/projects/${analysis.value.project_id}` : undefined },
  { label: analysis.value ? `Analysis ${analysisLabel(analysis.value.id)}` : "…" },
]);

async function loadProjectInfo(projectId) {
  try {
    const { data } = await api.get(`/projects/${projectId}`);
    projectName.value = data.name;
    mainLanguage.value = data.github?.language || "—";
  } catch {
    /* infos secondaires : on ignore l'échec */
  }
}

async function loadAnalysis() {
  // Réinitialise l'état : indispensable quand on passe d'une analyse à une autre
  // (ex: bouton « Relancer ») car la vue est réutilisée par Vue Router.
  stopPolling();
  loading.value = true;
  error.value = "";
  progress.value = 0;
  analysis.value = null;

  try {
    const { data } = await api.get(`/analyses/${route.params.id}`);
    analysis.value = data;
    loadProjectInfo(data.project_id);
    if (isRunning.value) startPolling();
  } catch {
    error.value = "Impossible de charger l'analyse.";
  } finally {
    loading.value = false;
  }
}

// Polling du pourcentage toutes les 2 s.
function startPolling() {
  stopPolling();
  pollTimer = setInterval(async () => {
    try {
      const { data } = await api.get(`/analyses/${route.params.id}/status`);
      progress.value = data.progress_percent;
      if (data.status === "completed" || data.status === "failed") {
        stopPolling();
        loading.value = true;
        await loadAnalysis();
        loading.value = false;
      }
    } catch {
      stopPolling();
    }
  }, 2000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function reanalyze() {
  restarting.value = true;
  try {
    const { data } = await api.post(`/projects/${analysis.value.project_id}/analyses`);
    router.push(`/analyses/${data.id}`);
  } catch {
    error.value = "Impossible de relancer l'analyse.";
    restarting.value = false;
  }
}

// Recharge à chaque changement d'id (montage initial ET « Relancer », qui ne
// fait que changer l'id sur la même vue → onMounted ne se déclencherait pas).
watch(() => route.params.id, loadAnalysis, { immediate: true });
onUnmounted(stopPolling);
</script>

<template>
  <AppLayout :breadcrumb="breadcrumb">
    <StateMessage v-if="loading" type="loading" message="Chargement de l'analyse…" />
    <StateMessage v-else-if="error" type="error" :message="error" />

    <template v-else-if="analysis">
      <!-- 1. Analyse en cours : uniquement le pourcentage (pas d'étapes, pas d'annulation) -->
      <div v-if="isRunning" class="flex-1 flex flex-col items-center justify-center py-16 text-center">
        <div class="max-w-2xl w-full flex flex-col items-center gap-6">
          <div class="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-primary pulse-border bg-primary/5">
            <span class="material-symbols-outlined text-primary text-4xl animate-spin">autorenew</span>
          </div>
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-ink">Analyse du code par l'IA...</h2>
            <p class="text-sm text-primary mt-2 font-mono">{{ progress }}% Terminé</p>
          </div>
          <div class="w-full max-w-md h-1 bg-white/10 rounded-full overflow-hidden">
            <div class="h-full bg-primary rounded-full transition-all duration-500 ease-out" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="text-sm text-muted">Cette opération peut prendre 1 à 3 minutes...</p>
        </div>
      </div>

      <!-- 2. Analyse échouée -->
      <div v-else-if="analysis.status === 'failed'" class="bg-surface border border-danger/30 rounded-lg p-6 text-danger">
        <p class="flex items-center gap-2 text-sm font-bold">
          <span class="material-symbols-outlined">error</span>
          L'analyse a échoué
        </p>
        <p class="mt-2 text-sm text-muted">{{ analysis.error_message || "Erreur inconnue." }}</p>
      </div>

      <!-- 3. Résultats -->
      <div v-else class="flex flex-col gap-6">
        <!-- En-tête (sans nb lignes, sans nb suggestions) -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 class="text-2xl md:text-3xl font-bold text-ink mb-2">Résultats de l'analyse</h2>
            <div class="flex flex-wrap items-center gap-3 text-muted text-sm font-mono">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                {{ formatDate(analysis.analysis_date) }}
              </span>
              <span>·</span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">description</span>
                {{ analysis.files_total ?? "—" }} fichiers
              </span>
              <span>·</span>
              <span class="flex items-center gap-1" :class="errorCount > 0 ? 'text-danger' : 'text-primary'">
                <span class="material-symbols-outlined text-[16px]">error</span>
                {{ errorCount }} erreurs
              </span>
            </div>
          </div>
          <button
            :disabled="restarting"
            class="px-4 py-2 bg-transparent border border-line text-ink text-sm rounded hover:bg-white/10 hover:border-muted transition-colors flex items-center gap-2 disabled:opacity-50"
            @click="reanalyze"
          >
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            {{ restarting ? "Relance…" : "Relancer" }}
          </button>
        </div>

        <!-- Diagramme de structure -->
        <section v-if="analysis.mermaid_diagram" class="bg-surface border border-line rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-line">
            <h3 class="text-sm font-bold text-ink font-mono">Structure du projet</h3>
          </div>
          <div class="p-6 bg-background">
            <MermaidDiagram :code="analysis.mermaid_diagram" />
          </div>
        </section>

        <!-- Vue d'ensemble -->
        <section v-if="analysis.code_overview" class="bg-surface border border-line rounded-lg p-6">
          <h3 class="text-xl font-bold text-ink mb-4">Vue d'ensemble</h3>
          <p class="text-sm text-muted mb-6 leading-relaxed">{{ analysis.code_overview }}</p>
          <div v-if="mainLanguage !== '—'" class="flex flex-wrap gap-2">
            <span class="px-2 py-1 bg-primary/10 border border-primary/30 rounded text-xs text-primary">{{ mainLanguage }}</span>
          </div>
        </section>

        <!-- Erreurs détectées -->
        <section class="flex flex-col gap-4">
          <div class="flex justify-between items-end border-b border-line pb-2">
            <h3 class="text-xl font-bold text-ink">Erreurs détectées</h3>
            <div class="flex gap-2 text-xs">
              <button
                v-if="counts.high"
                class="px-2 py-1 border rounded transition-colors"
                :class="severityFilter === 'high' ? 'bg-danger text-background border-danger' : 'bg-danger/20 border-danger/50 text-danger hover:bg-danger/30'"
                @click="toggleFilter('high')"
              >High ({{ counts.high }})</button>
              <button
                v-if="counts.medium"
                class="px-2 py-1 border rounded transition-colors"
                :class="severityFilter === 'medium' ? 'bg-amber-400 text-background border-amber-400' : 'bg-amber-400/10 border-amber-400/30 text-amber-400 hover:bg-amber-400/20'"
                @click="toggleFilter('medium')"
              >Medium ({{ counts.medium }})</button>
              <button
                v-if="counts.low"
                class="px-2 py-1 border rounded transition-colors"
                :class="severityFilter === 'low' ? 'bg-primary text-background border-primary' : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'"
                @click="toggleFilter('low')"
              >Low ({{ counts.low }})</button>
            </div>
          </div>

          <StateMessage v-if="allErrors.length === 0" type="empty" message="Aucune erreur détectée. Beau travail !" />
          <ErrorItem
            v-for="(item, index) in visibleErrors"
            v-else
            :key="index"
            :error="item.error"
            :file-path="item.filePath"
          />
        </section>
      </div>
    </template>
  </AppLayout>
</template>

<style scoped>
.pulse-border {
  animation: pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse-border {
  0%,
  100% {
    border-color: rgba(78, 222, 163, 1);
    box-shadow: 0 0 0 0 rgba(78, 222, 163, 0.7);
  }
  50% {
    border-color: rgba(78, 222, 163, 0.5);
    box-shadow: 0 0 0 10px rgba(78, 222, 163, 0);
  }
}
</style>
