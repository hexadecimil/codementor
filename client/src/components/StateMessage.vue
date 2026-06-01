<script setup>
// État réutilisable : chargement, vide ou erreur.
defineProps({
  type: { type: String, default: "info" }, // "loading" | "empty" | "error"
  message: { type: String, default: "" },
});
</script>

<template>
  <div class="flex flex-col items-center gap-3 py-12 text-center text-sm" :class="type === 'error' ? 'text-danger' : 'text-muted'">
    <span class="material-symbols-outlined text-[40px]" :class="{ 'animate-spin': type === 'loading' }">
      {{ type === "loading" ? "progress_activity" : type === "error" ? "error" : "inbox" }}
    </span>
    <p>{{ message }}</p>
  </div>
</template>
