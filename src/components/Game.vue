<template>
    <Grid @updateCell="updateGrid" :gridRows="gridRows" :colors="colors" :gridColumns="gridColumns" :hints="hints" :errors="errors" :victory="victory"></Grid>
    <Tools :colors='colors' 
           :currentColor="currentColor" 
           :gridRows="gridRows"
           :gridColumns="gridColumns"
           :hypothesisMode="hypothesisMode"
           :isFilled="isFilled"
           :shareLink="shareLink"
           :editMode="editMode"
           :victory="victory"
           :solvability="solvability"
           :solvabilityLoading="solvabilityLoading"
           @removeColor="removeColor" 
           @addColor="addColor" 
           @updateRows="updateRows"
           @updateCols="updateCols"
           @fillColor="fillColor"
           @updateShareLink="updateShareLink"
           @switchMode="switchMode"
           @clickHistory="moveBackFromHistory"
           @enableHypothesisMode="enableHypothesisMode"
           @disableHypothesisMode="disableHypothesisMode"
           @validateHypothesis="validateHypothesis"
    ></Tools>
    <Modal :title="modalTitle" :message="modalMessage"  @close="openModal = false"  :type="'message'" v-if="openModal"></Modal>
</template>

<script setup>
// Game.vue est l'orchestrateur : il assemble les composables de domaine
// (couleurs, grille, indices, solvabilité, hypothèse, daily, source URL),
// détient l'état d'UI transverse (mode, victoire, modale) et coordonne les
// watchers qui relient la grille aux indices, à la victoire et à la solvabilité.
import { ref, computed, provide, watch, onMounted } from 'vue';
import Grid from './Grid.vue';
import Tools from './Tools.vue';
import Modal from './Modal.vue';
import { useColors } from '../composables/useColors.js';
import { useGrid } from '../composables/useGrid.js';
import { useHints } from '../composables/useHints.js';
import { useSolvability } from '../composables/useSolvability.js';
import { useHypothesis } from '../composables/useHypothesis.js';
import { useDaily } from '../composables/useDaily.js';
import { usePuzzleSource } from '../composables/usePuzzleSource.js';

const emit = defineEmits(['daily-state']);

// --- État d'UI transverse ---
// `editMode` est partagé par presque tous les domaines : on le détient ici.
const editMode = ref(true);
const victory = ref(false);
const modalTitle = ref('');
const modalMessage = ref('');
const openModal = ref(false);

// --- Composables de domaine ---
const { colors, currentColor, updateColors, updateCurrentColor, addColor, seedInitialColors } = useColors();

const {
    grid, correctGrid, gridColumns, gridRows, history, isFilled,
    generateGrid, updateGrid, moveBackFromHistory: undoLastMove, getGridDifferences,
    getColumnCells, fillColor, removeColorFromGrid, updateRows, updateCols,
    resizeGridRows, resizeGridColumns,
} = useGrid({ currentColor });

const { hints, errors, noErrors, updateHints, refreshHints } = useHints({
    grid, gridRows, gridColumns, colors, editMode, getColumnCells,
});

const { solvability, solvabilityLoading, scheduleSolvabilityCheck } = useSolvability({
    editMode, isFilled, gridRows, gridColumns, hints, colors,
});

const { hypothesisMode, gridBackup, enableHypothesisMode, disableHypothesisMode, validateHypothesis } = useHypothesis({
    grid, history,
});

// --- Fonctions transverses (orchestration) ---
// Applique un puzzle chargé (mode jeu/daily) sur l'ensemble des domaines.
function applyPuzzle(puzzle) {
    colors.value = puzzle.colors;
    correctGrid.value = puzzle.grid;
    gridRows.value = puzzle.gridRows;
    gridColumns.value = puzzle.gridColumns;
    hints.value = puzzle.hints;
}

// Remet la partie à zéro (changement de grille daily).
function resetPlayState() {
    victory.value = false;
    openModal.value = false;
    history.value = [];
    hypothesisMode.value = false;
    gridBackup.value = [];
    errors.value = { rows: [], columns: [] };
    currentColor.value = 0;
    grid.value = [];
    generateGrid();
}

function emitDailyState() {
    emit('daily-state', {
        dailyMode: daily.dailyMode.value,
        dailyDateKey: daily.dailyDateKey.value,
        canGoPreviousDaily: daily.canGoPreviousDaily.value,
        canGoNextDaily: daily.canGoNextDaily.value,
    });
}

function showModal(title, message) {
    modalTitle.value = title;
    modalMessage.value = message;
    openModal.value = true;
}

// Retire la dernière couleur (liste + grille) et réajuste le pinceau.
function removeColor() {
    const removedColor = colors.value.length - 1;
    colors.value.pop();
    removeColorFromGrid(removedColor);
    updateCurrentColor(colors.value.length - 1);
}

// L'annulation est désactivée après la victoire.
function moveBackFromHistory() {
    undoLastMove(victory.value);
}

function checkVictory() {
    if (JSON.stringify(grid.value) === JSON.stringify(correctGrid.value)) {
        victory.value = true;
        // Clic fantôme sur l'overlay de la modale seulement sur mobile ; le setTimeout l'évite.
        // TODO : trouver la cause du clic fantôme sur mobile.
        setTimeout(() => {
            openModal.value = true;
        }, 200);
        modalTitle.value = 'Bravo !';
        modalMessage.value = 'Tu as réussi à résoudre ce picross !';
    } else {
        openModal.value = true;
        modalTitle.value = 'Dommage !';
        modalMessage.value = 'Toutes les cases sont remplies, mais elles ne correspondent pas à la solution. Tu peux fermer cette fenêtre et tenter de corriger !';
    }
}

// --- Composables dépendant des fonctions transverses ---
const daily = useDaily({ applyPuzzle, resetPlayState, emitDailyState });

const { shareLink, checkMode, switchMode, updateShareLink } = usePuzzleSource({
    editMode,
    colors,
    seedInitialColors,
    applyPuzzle,
    daily,
    emitDailyState,
    resetVictory: () => { victory.value = false; },
    showModal,
    grid,
    gridColumns,
});

// --- Détection de changement par valeur ---
// Les tableaux étant passés par référence, on stringifie pour diffuser un vrai diff.
const stringifiedGrid = computed(() => JSON.stringify(grid.value));
const stringifiedColors = computed(() => JSON.stringify(colors.value));

// --- Fourniture aux descendants (refs réactives + fonctions) ---
provide('editMode', editMode);
provide('gridColumns', gridColumns);
provide('gridRows', gridRows);
provide('grid', grid);
provide('colors', colors);
provide('currentColor', currentColor);
provide('hints', hints);
provide('updateGrid', updateGrid);
provide('updateColors', updateColors);
provide('updateCurrentColor', updateCurrentColor);

// --- Watchers d'orchestration ---
// Quand la grille change : met à jour les indices touchés, teste la victoire (jeu)
// et relance l'analyse de solvabilité (édition).
watch(stringifiedGrid, (stringNewGrid, stringOldGrid) => {
    const newGrid = JSON.parse(stringNewGrid);
    const oldGrid = JSON.parse(stringOldGrid);
    const gridDiffs = getGridDifferences(newGrid, oldGrid);

    updateHints(gridDiffs.rowsToUpdate, gridDiffs.columnsToUpdate);

    if (!editMode.value && !hypothesisMode.value && isFilled.value && noErrors.value) {
        checkVictory();
    }

    scheduleSolvabilityCheck();
});

// Un changement de couleurs recalcule tous les indices.
watch(stringifiedColors, () => {
    refreshHints();
    scheduleSolvabilityCheck();
});

// Un changement de dimensions redimensionne la grille puis recalcule les indices.
watch(gridRows, (newRows, oldRows) => {
    if (editMode.value) {
        resizeGridRows(newRows - oldRows);
        refreshHints();
        scheduleSolvabilityCheck();
    }
});

watch(gridColumns, (newColumns, oldColumns) => {
    if (editMode.value) {
        resizeGridColumns(newColumns - oldColumns);
        refreshHints();
        scheduleSolvabilityCheck();
    }
});

// --- Cycle de vie ---
onMounted(() => {
    checkMode();
    generateGrid();
    emitDailyState();
});

// Exposé pour le parent (App) qui pilote la navigation daily via un ref de composant.
defineExpose({
    goToPreviousDaily: daily.goToPreviousDaily,
    goToNextDaily: daily.goToNextDaily,
});
</script>
