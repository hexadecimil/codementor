<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import AppLayout from "@/layouts/AppLayout.vue";
import StateMessage from "@/components/StateMessage.vue";
import BaseButton from "@/components/BaseButton.vue";
import { relativeDate, repoFullName } from "@/utils/format";

const router = useRouter();

const projects = ref([]);
const loading = ref(true);
const error = ref("");
const search = ref("");

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return projects.value;
  return projects.value.filter((project) =>
    repoFullName(project.github_repo_url).toLowerCase().includes(q),
  );
});

async function loadProjects() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/projects");
    projects.value = data;
  } catch {
    error.value = "Impossible de charger les projets.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadProjects);
</script>

<template>
  <AppLayout :breadcrumb="[{ label: 'Projets' }]">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-2xl md:text-3xl font-bold text-ink tracking-tight mb-2">Mes projets</h1>
      <p class="text-sm text-muted">Vos dépôts GitHub analysés</p>
    </div>

    <!-- Recherche + CTA -->
    <div class="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
      <div class="relative w-full sm:w-64">
        <span class="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-muted">search</span>
        <input
          v-model="search"
          class="w-full bg-background border border-line text-ink text-sm rounded pl-10 pr-4 py-2 focus:outline-none focus:border-primary transition-colors placeholder:text-muted/50"
          placeholder="Rechercher..."
          type="text"
          aria-label="Rechercher un projet"
        />
      </div>
      <BaseButton to="/projects/new" class="shrink-0">
        <span class="material-symbols-outlined text-[20px]">add</span>
        <span>Nouveau projet</span>
      </BaseButton>
    </div>

    <StateMessage v-if="loading" type="loading" message="Chargement des projets…" />
    <StateMessage v-else-if="error" type="error" :message="error" />
    <StateMessage v-else-if="filtered.length === 0" type="empty" message="Aucun projet. Ajoutez un dépôt GitHub pour commencer." />

    <!-- Grille -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="project in filtered"
        :key="project.id"
        class="bg-surface border border-line rounded-lg p-6 hover:border-muted/40 transition-colors cursor-pointer"
        @click="router.push(`/projects/${project.id}`)"
      >
        <div class="flex items-center gap-3 mb-4">
          <div class="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <span class="material-symbols-outlined text-[16px]">folder</span>
          </div>
          <h3
            class="text-base font-bold text-ink truncate"
            :title="repoFullName(project.github_repo_url)"
          >
            {{ repoFullName(project.github_repo_url) }}
          </h3>
        </div>

        <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-line/50">
          <span class="px-2 py-1 rounded bg-background border border-line text-muted text-xs flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px]">analytics</span>
            {{ project.analysis_count }} analyse(s)
          </span>
          <span class="text-muted/70 text-xs ml-auto">{{ relativeDate(project.created_at) }}</span>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
