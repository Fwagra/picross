<template>
    <div class="grid" :style="gridStyles">
        <template v-for="(row, rowIndex) in this.grid">
            <Cell @updateCell="updateGrid"  v-for="(column, columnIndex) in row" :rowIndex="rowIndex" :columnIndex="columnIndex" :color="this.grid[rowIndex][columnIndex]" :key="column"></Cell>
        </template>
    </div>
</template>


<script>
import Cell from './Cell.vue';
export default {
    components: {
        Cell
    },
    inject: ['gridColumuns', 'gridRows', 'grid', 'colors'],
    data() {
        return {
            gridStyles: {
                gridTemplateColumns: `repeat(${this.gridColumuns}, 1fr)`,
                gridTemplateRows: `repeat(${this.gridRows}, 1fr)`,
            }
        }
    },
    methods: {
        updateGrid(rowIndex, columnIndex) {
            // Update the grid array with the new color
            this.grid[rowIndex][columnIndex] = this.colors[Math.floor(Math.random() * this.colors.length)];
        }
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