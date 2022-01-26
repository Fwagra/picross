<template>
    <Grid @updateCell="updateGrid"></Grid>
</template>

<script>

import Grid from './Grid.vue';

export default {
    components: {
        Grid
    },
    data() {
        return {
            gridColumuns: 5,
            gridRows: 5,
            grid: [],
            colors: ['red', 'green', 'blue'],
        }
    },
    provide() {
        return {
            gridColumuns: this.gridColumuns,
            gridRows: this.gridRows,
            grid: this.grid,
            colors: this.colors,
        }
    },
    mounted() {
        // Generate the grid array with the correct number of rows and columns
        this.generateGrid();
    },
    methods: {
        generateGrid() {
            for (let i = 0; i < this.gridRows; i++) {
                this.grid[i] = [];
                for (let j = 0; j < this.gridColumuns; j++) {
                    this.grid[i][j] = "";
                }
            }
        },
        updateGrid(rowIndex, columnIndex) {
            // Update the grid array with the new color
            this.grid[rowIndex][columnIndex] = this.colors[Math.floor(Math.random() * this.colors.length)];
        }
    }
}
</script>