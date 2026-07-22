<script setup>
import { ref, computed } from "vue";
import { severityInfo, ERROR_TYPE_LABELS } from "@/utils/format";

// Une erreur détectée par l'IA, repliable (style « Erreurs détectées » des maquettes).
const props = defineProps({
  error: { type: Object, required: true },
  filePath: { type: String, default: "" },
});

const expanded = ref(false);
const sev = computed(() => severityInfo(props.error.severity));
const typeLabel = computed(() => ERROR_TYPE_LABELS[props.error.error_type] || props.error.error_type);
const location = computed(() => {
  if (!props.filePath) return "";
  return props.error.line_number ? `${props.filePath}:${props.error.line_number}` : props.filePath;
});
const hasFix = computed(() => props.error.fix_description || props.error.fix_suggested_code);
</script>

<template>
  <div
    class="bg-surface rounded-lg overflow-hidden border transition-all duration-200"
    :class="expanded ? sev.border : 'border-line hover:border-muted/40'"
  >
    <!-- En-tête cliquable -->
    <div class="p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors" @click="expanded = !expanded">
      <span class="material-symbols-outlined text-[20px] mt-0.5" :class="sev.iconColor">{{ sev.icon }}</span>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between items-start gap-2 mb-1">
          <h4 class="text-sm font-bold text-ink">{{ typeLabel }}</h4>
          <span class="px-2 py-0.5 rounded text-xs shrink-0" :class="sev.badge">{{ sev.label }}</span>
        </div>
        <p v-if="location" class="font-mono text-xs text-primary mb-2 truncate">{{ location }}</p>
        <p class="text-sm text-muted">{{ error.description }}</p>
      </div>
      <span class="material-symbols-outlined text-muted">{{ expanded ? "expand_less" : "expand_more" }}</span>
    </div>

    <!-- Détails (code fautif + correction) -->
    <div
      v-if="expanded && (error.code_snippet || hasFix)"
      class="border-t border-line bg-background p-4 text-xs overflow-x-auto space-y-3"
    >
      <div v-if="error.code_snippet">
        <div class="text-muted mb-1">Code concerné :</div>
        <pre class="font-mono leading-relaxed text-danger/90 bg-danger/5 rounded p-3 overflow-x-auto"><code>{{ error.code_snippet }}</code></pre>
      </div>

      <div v-if="hasFix">
        <div class="text-primary mb-1 flex items-center gap-1">
          <span class="material-symbols-outlined text-[16px]">lightbulb</span>
          Correction suggérée :
        </div>
        <p v-if="error.fix_description" class="text-muted mb-2">{{ error.fix_description }}</p>
        <pre v-if="error.fix_suggested_code" class="font-mono leading-relaxed text-primary bg-primary/5 rounded p-3 overflow-x-auto"><code>{{ error.fix_suggested_code }}</code></pre>
      </div>
    </div>
  </div>
</template>
