<script setup>
import SidebarNav from "@/components/SidebarNav.vue";
import MobileTopBar from "@/components/MobileTopBar.vue";

// breadcrumb : tableau d'éléments { label, to? }. Le dernier = page courante.
defineProps({
  breadcrumb: { type: Array, default: () => [] },
});
</script>

<template>
  <div class="min-h-screen bg-background text-ink flex">
    <SidebarNav />

    <div class="flex-1 flex flex-col min-h-screen md:ml-[240px] min-w-0">
      <!-- Barre mobile : remplace la sidebar masquée sous md (logo + déconnexion) -->
      <MobileTopBar />

      <!-- Barre du haut : fil d'Ariane (se cale sous la barre mobile sur petit écran) -->
      <header class="sticky top-14 md:top-0 z-40 h-14 w-full bg-surface/80 backdrop-blur-md border-b border-line flex items-center px-6">
        <nav class="flex items-center gap-2 min-w-0 font-mono text-sm">
          <template v-for="(item, index) in breadcrumb" :key="index">
            <span v-if="index > 0" class="text-line">/</span>
            <RouterLink v-if="item.to" :to="item.to" class="text-muted hover:text-primary transition-colors truncate">
              {{ item.label }}
            </RouterLink>
            <span v-else class="text-ink font-bold truncate">{{ item.label }}</span>
          </template>
        </nav>
      </header>

      <!-- Contenu -->
      <main class="flex-1 p-4 md:p-6 max-w-[1440px] mx-auto w-full">
        <slot />
      </main>
    </div>
  </div>
</template>
