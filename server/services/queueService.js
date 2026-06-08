// File d'attente en mémoire : MAX_CONCURRENT jobs en parallèle maximum.
const MAX_CONCURRENT = Number(process.env.ANALYSIS_CONCURRENCY) || 1;

const queue = [];
let activeWorkers = 0;

/**
 * Ajoute un job à la file et démarre un worker s'il reste un slot libre.
 * @param {() => Promise<void>} job  Fonction async à exécuter (ex: () => run(analysisId))
 */
export const enqueue = (job) => {
  queue.push(job);

  if (activeWorkers < MAX_CONCURRENT) {
    activeWorkers++;
    worker();
  }
};

/**
 * Boucle interne : pioche et exécute les jobs un à un jusqu'à ce que la file
 * soit vide, puis libère son slot.
 * @returns {Promise<void>}
 */
const worker = async () => {
  while (queue.length > 0) {
    const job = queue.shift();
    try {
      await job();
    } catch (err) {
      console.error("Échec d'un job de la file d'analyse :", err);
    }
  }
  activeWorkers--;
};
