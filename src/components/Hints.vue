<template>
    <div class="cell" ref="cell" :class="{error: error, highlight: highlight}" v-tippy="errorTip">
        <ColorHint v-for="(colorHint, colorIndex) in hint" :hint="colorHint" :color="colorIndex" :key="`color-${colorIndex}`"></ColorHint>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUpdated } from 'vue';
import ColorHint from './ColorHint.vue';

const props = defineProps(['hint', 'error', 'type', 'highlight']);
const emit = defineEmits(['updateFauxCell']);

const cell = ref(null);

const errorTip = computed(() => (props.error ? 'Les couleurs ne correspondent pas aux indices' : ''));

// Remonte la largeur de la case d'indices pour aligner la fausse cellule du coin.
function updateFauxCell() {
    emit('updateFauxCell', cell.value.clientWidth);
}

onMounted(updateFauxCell);
onUpdated(updateFauxCell);
</script>

<style scoped>
.error {
    background: rgb(235, 160, 160);
}
/* Surlignage de l'indice dont la ligne/colonne est survolée dans la grille. */
.highlight {
    background: rgba(86, 112, 197, 0.10);
}
.row-hints,
.col-hints {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.row-hints {
    border-radius: 5px 0  0 5px;
}

.col-hints {
    border-radius: 5px 5px  0 0;
    flex-direction: column;
    
}
</style>