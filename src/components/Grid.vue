<template>
    <div class="board-wrapper">
        <div class="boardgame">
            <div class="head">
                    <div class="cell faux-cell" :style="fauxCellStyles">
                        <Hints class="col-hints" type="col" :hint="hints.columns[0]"></Hints>
                    </div>
                    <Hints
                        @updateFauxCell="updateFauxCell"
                        type="row"
                        v-for="(hint, hintIndex) in hints.rows"
                        :key="hintIndex"
                        class="row-hints"
                        :hint="hint"
                        :error="errors.rows[hintIndex]"
                        :highlight="hintIndex === hoveredRow"
                    ></Hints>
            </div>
            <div class="main">

                <div class="hints" :style="headStyles">
                    <Hints
                        type="col"
                        class="col-hints"
                        v-for="(hint, hintIndex) in hints.columns"
                        :hint="hint"
                        :error="errors.columns[hintIndex]"
                        :highlight="hintIndex === hoveredColumn"
                        :key="hintIndex"
                    ></Hints>
                </div>
                <div class="grid" @mouseleave="onGridLeave" @touchmove="debouncedMobileDrag" :style="gridStyles">

                    <template v-for="(row, rowIndex) in grid" :key="rowIndex">
                        <Cell
                        v-for="(column, columnIndex) in row"
                        @updateCell="updateGrid"
                        @press="press"
                        @release="release"
                        @hover="hover"
                        :rowIndex="rowIndex"
                        :columnIndex="columnIndex"
                        :totalRows="gridRows"
                        :totalColumns="gridColumns"
                        :pressed="pressed"
                        :color="grid[rowIndex][columnIndex]"
                        :key="columnIndex"></Cell>
                    </template>
            </div>
            </div>
        </div>
        <div v-if="victory" class="blocker"></div>
    </div>
</template>


<script setup>
import { ref, computed } from 'vue';
import { inject } from 'vue';
import Cell from './Cell.vue';
import Hints from './Hints.vue';

const props = defineProps(['gridRows', 'gridColumns', 'colors', 'hints', 'errors', 'victory']);
const emit = defineEmits(['update-cell']);

const grid = inject('grid');
const updateGrid = inject('updateGrid');
const currentColor = inject('currentColor');

const fauxCellWidth = ref(0);
const pressed = ref(false);
const lastMobileDragTime = ref(0);
// Cellule survolée : sert à surligner sa ligne/colonne pour la lecture.
const hoveredRow = ref(null);
const hoveredColumn = ref(null);

const gridStyles = computed(() => ({
    gridTemplateColumns: `repeat(${props.gridColumns}, 1fr)`,
    gridTemplateRows: `repeat(${props.gridRows}, 1fr)`,
    flex: props.gridColumns,
}));

// Largeur mesurée sur les indices de ligne — aligne le coin supérieur gauche.
const fauxCellStyles = computed(() =>
    fauxCellWidth.value
        ? { width: fauxCellWidth.value + 'px', minWidth: fauxCellWidth.value + 'px' }
        : {}
);

const headStyles = computed(() => ({ flex: props.gridColumns }));

function updateFauxCell(width) {
    fauxCellWidth.value = width;
}

function press() {
    pressed.value = true;
}

function release() {
    pressed.value = false;
}

// Mémorise la cellule survolée pour surligner sa ligne et sa colonne.
function hover(rowIndex, columnIndex) {
    hoveredRow.value = rowIndex;
    hoveredColumn.value = columnIndex;
}

// Quitte la grille : relâche le tracé et coupe le surlignage.
function onGridLeave() {
    release();
    hoveredRow.value = null;
    hoveredColumn.value = null;
}

// Throttle tactile : l'ancien « debounce » recréait une fermeture à chaque
// touchmove, donc le délai n'était jamais respecté.
function debouncedMobileDrag(e) {
    if (props.victory) return;
    const now = Date.now();
    if (now - lastMobileDragTime.value < 200) return;
    lastMobileDragTime.value = now;
    mobileDrag(e);
}

// Tracé tactile : on retrouve la case sous le doigt via les data-attrs du DOM
// (plus de refs dynamiques). La couleur est lue directement dans la grille.
function mobileDrag(e) {
    const position = e.touches[0];
    const el = document.elementFromPoint(position.clientX, position.clientY);
    const cellEl = el ? el.closest('.grid-cell') : null;
    if (!cellEl) return;

    const rowIndex = Number(cellEl.dataset.row);
    const columnIndex = Number(cellEl.dataset.col);
    const color = grid.value[rowIndex]?.[columnIndex];

    if (color === '' || currentColor.value === '') {
        emit('update-cell', rowIndex, columnIndex);
    }
}
</script>

<style scoped>
.board-wrapper {
    display: flex;
    user-select: none;
    justify-content: center;
    position: relative;
}
.grid {
    display: grid;
    user-select: none;
    border-top: 2px dashed var(--grid-separations);
    border-left: 2px dashed var(--grid-separations);
}
.col-hints,
.row-hints {
    user-select: none;
    padding: 3px;
    
}
.head,
.boardgame
 {
    display: flex;
}
.head .hints,
.head {
    flex-direction: column;
}
.head .hints .cell {
    flex: 1;
}
.faux-cell {
    visibility: hidden;
}
.head .hints,
.main .hints {
    flex: 1;
    display: flex;
    justify-content: space-around;
}
.head .hints {
    justify-content: flex-end;
}
.blocker {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 2;
    right: 0;
}

</style>
