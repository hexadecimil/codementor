<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";

// Rend un diagramme Mermaid en SVG, dans lequel on peut zoomer et se déplacer.
const props = defineProps({
  code: { type: String, default: "" },
});

const container = ref(null);
const failed = ref(false);

// Limites relevées : les gros repos génèrent des diagrammes avec beaucoup de
// nœuds/liens, au-delà des plafonds par défaut de Mermaid (sinon il refuse de rendre).
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  // Le code Mermaid provient de l'IA (source non fiable) : le niveau « strict »
  // fait passer le SVG dans DOMPurify et neutralise toute injection HTML.
  securityLevel: "strict",
  maxEdges: 2000,
  maxTextSize: 200000,
});

let renderId = 0;
let panZoom = null; // instance svg-pan-zoom à détruire avant un nouveau rendu

function destroyPanZoom() {
  if (panZoom) {
    panZoom.destroy();
    panZoom = null;
  }
}

async function render() {
  failed.value = false;
  destroyPanZoom();
  if (!props.code || !container.value) return;

  const myId = (renderId += 1);
  try {
    const { svg } = await mermaid.render(`mermaid-${myId}`, props.code);
    // Un rendu plus récent a démarré pendant l'attente : on abandonne celui-ci
    // (« dernier gagné ») pour ne pas écraser le diagramme courant.
    if (myId !== renderId || !container.value) return;
    container.value.innerHTML = svg;

    // Rend le SVG navigable (zoom molette + déplacement à la souris).
    const svgEl = container.value.querySelector("svg");
    if (svgEl) {
      // Libellé accessible : le diagramme représente la structure du projet.
      svgEl.setAttribute("role", "img");
      svgEl.setAttribute("aria-label", "Diagramme de structure du projet");
      // Mermaid ajoute un "max-width" en ligne qui empêche le SVG de remplir le
      // conteneur (d'où une bande de fond visible à droite). On le retire.
      svgEl.style.maxWidth = "none";
      svgEl.style.width = "100%";
      svgEl.style.height = "100%";
      panZoom = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: true, // boutons +/-/reset
        fit: true,
        center: true,
        minZoom: 0.2,
        maxZoom: 20,
      });
      // Le conteneur vient d'être rempli : on recalcule les dimensions puis on
      // recentre, sinon svg-pan-zoom garde parfois la taille du premier rendu.
      panZoom.resize();
      panZoom.fit();
      panZoom.center();
    }
  } catch {
    // Diagramme invalide ou trop gros : on montre le code source en repli.
    failed.value = true;
    container.value.innerHTML = "";
  }
}

onMounted(render);
watch(() => props.code, render);
onUnmounted(destroyPanZoom);
</script>

<template>
  <div>
    <!-- Cadre à hauteur fixe : on navigue à l'intérieur (zoom / déplacement). -->
    <div
      v-show="!failed"
      ref="container"
      class="h-[500px] w-full rounded-lg bg-background border border-line overflow-hidden"
    ></div>

    <div v-if="failed" class="text-xs">
      <p class="text-muted mb-2">Le diagramme n'a pas pu être affiché. Code source :</p>
      <pre class="overflow-x-auto rounded-lg bg-background p-3 font-mono"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>
