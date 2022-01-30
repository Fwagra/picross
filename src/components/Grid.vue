<template>
    <div class="grid" :style="gridStyles">
        <div :style="cellStyles" class="cell"></div>
        <Hints class="col-hints" :style="cellStyles" v-for="(hint, hintIndex) in hints.columns" :hint="hint" :error="errors.columns[hintIndex]" :key="hintIndex"></Hints>
        <template v-for="(row, rowIndex) in this.grid" :key="rowIndex">
            <Hints :style="rowHintsStyles" class="row-hints" :hint="hints.rows[rowIndex]" :error="errors.rows[rowIndex]"></Hints>
            <Cell 
            :style="cellStyles"
            v-for="(column, columnIndex) in row"
            @updateCell="updateGrid"  
            :rowIndex="rowIndex" 
            :columnIndex="columnIndex" 
            :totalRows="gridRows"
            :totalColumns="gridColumns"
            :color="this.grid[rowIndex][columnIndex]" 
            :key="columnIndex"></Cell>
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
    inject: [ 'grid', 'updateGrid'],
    props: ['gridRows',  'gridColumns','colors', 'hints', 'errors'],
    computed: {
        gridStyles() {
            return {
                gridTemplateColumns: `repeat(${this.gridColumns +1}, 1fr)`,
                gridTemplateRows: `repeat(${this.gridRows +1}, 1fr)`,
            }
        },
        cellStyles() {
            return {
                // width: this.gridColumns > 9 ? '1rem' : 'auto',
                // height: this.gridColumns > 9 ? '1rem' : 'auto',
            }
        },
        rowHintsStyles() {
            return {
                // width: this.gridColumns > 9 ? '2rem' : 'auto',
                // height: this.gridColumns > 9 ? '2rem' : 'auto',     
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
    user-select: none;
}
.row-hints {
    border-right: 2px dashed var(--grid-separations);
    
}
.col-hints {
    border-bottom: 2px dashed var(--grid-separations);
}

</style>