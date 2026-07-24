<template>
    <div :class="cellClasses" class="cell grid-cell" :data-row="rowIndex" :data-col="columnIndex" v-touch:tap="updateCell" v-touch:press="press" v-touch:release="release" @mouseover="onMouseover" :style="style"></div>
</template>

<script setup>
import { computed, inject } from 'vue';

const props = defineProps(['color', 'rowIndex', 'columnIndex', 'totalRows', 'totalColumns', 'pressed']);
const emit = defineEmits(['hover', 'update-cell', 'release', 'press']);

const colors = inject('colors');
const currentColor = inject('currentColor');

const style = computed(() => ({
    backgroundColor: colors.value[props.color],
}));

const cellClasses = computed(() => ({
    col5: (props.columnIndex + 1) % 5 === 0 && props.columnIndex + 1 < props.totalColumns,
    row5: (props.rowIndex + 1) % 5 === 0 && props.rowIndex + 1 < props.totalRows,
}));

// Signale le survol (surlignage des indices) puis gère le tracé au drag.
function onMouseover() {
    emit('hover', props.rowIndex, props.columnIndex);
    drag();
}

function drag() {
    if ((props.pressed && props.color === '') || (props.pressed && currentColor.value === '')) {
        emit('update-cell', props.rowIndex, props.columnIndex);
    }
}

function updateCell() {
    if (!props.pressed) {
        emit('release');
        emit('update-cell', props.rowIndex, props.columnIndex);
    }
}

function press() {
    document.documentElement.style.overflow = 'hidden';
    emit('press');
    emit('update-cell', props.rowIndex, props.columnIndex);
}

function release() {
    emit('release');
    document.documentElement.style.overflow = 'auto';
}
</script>
<style scoped>
.cell {
    /* padding: 1rem; */
    cursor: pointer;
    border-right: 2px dashed var(--grid-separations);
    border-bottom: 2px dashed var(--grid-separations);
    aspect-ratio: 1;

}
    @supports not (aspect-ratio: auto) { 
        .cell {

            padding-top: 100%;
        height: 0;
        position: relative;
        overflow: hidden;
        }
        

    }
.col5 {
    border-right: 2px dashed var(--grid-dark);
}
.row5 {
    border-bottom: 2px dashed var(--grid-dark);
}
.col5, .row5 {
    z-index: 1;
}
.col5.row5 {
    z-index: 2;

}

</style>