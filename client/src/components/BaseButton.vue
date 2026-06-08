<script setup>
import { computed } from "vue";

// Bouton réutilisable de l'application : évite de recopier le style du CTA dans
// chaque vue (un seul endroit à modifier pour changer l'apparence des boutons).
// - variant : "primary" (vert plein) ou "secondary" (contour).
// - to : si fourni, rend un <RouterLink> ; sinon un <button>.
// - disabled : ne s'applique qu'au mode <button> (un RouterLink resterait cliquable).
const props = defineProps({
  variant: { type: String, default: "primary" }, // "primary" | "secondary"
  to: { type: [String, Object], default: null },
  type: { type: String, default: "button" },
  disabled: { type: Boolean, default: false },
});

const base =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100";

const variants = {
  primary: "bg-primary text-background hover:bg-primary-hover hover:text-white hover:scale-[1.03]",
  secondary: "bg-transparent border border-line text-ink hover:bg-white/10 hover:border-muted",
};

const classes = computed(() => `${base} ${variants[props.variant] || variants.primary}`);
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes">
    <slot />
  </RouterLink>
  <button v-else :type="type" :disabled="disabled" :class="classes">
    <slot />
  </button>
</template>
