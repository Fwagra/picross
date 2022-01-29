<template>
    <div class="grid" :style="gridStyles">
        <div class="cell"></div>
        <Hints class="col-hints" v-for="(hint, hintIndex) in hints.columns" :hint="hint" :key="hintIndex"></Hints>
        <template v-for="(row, rowIndex) in this.grid" :key="rowIndex">
            <Hints class="row-hints" :hint="hints.rows[rowIndex]"></Hints>
            <Cell @updateCell="updateGrid"  v-for="(column, columnIndex) in row" :rowIndex="rowIndex" :columnIndex="columnIndex" :color="this.grid[rowIndex][columnIndex]" :key="columnIndex"></Cell>
        </template>
    </div>
</template>


<script>
import Cell from './Cell.vue';
import Hints from './Hints.vue';
export default {
    components: {
        Cell,
        Hints
    },
    inject: [ 'grid', 'colors', 'updateGrid', 'hints'],
    props: ['gridRows', 'gridColumns'],
    computed: {
        gridStyles() {
            return {
                gridTemplateColumns: `repeat(${this.gridColumns +1}, 1fr)`,
                gridTemplateRows: `repeat(${this.gridRows +1}, 1fr)`,
            }
        }
    },


    methods: {
       
    }
}
</script>

<style scoped>
.grid {
    display: grid;
    grid-auto-rows: 1fr;
    grid-gap: 2px;
    
}
</style>