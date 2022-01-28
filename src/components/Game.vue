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
            hints: {
                rows: [],
                columns: [],
            },
            colors: ['red', 'green', 'blue'],
        }
    },
    computed: {
        stringifiedGrid() {
            return JSON.stringify(this.grid);
        }
    },
    provide() {
        return {
            gridColumuns: this.gridColumuns,
            gridRows: this.gridRows,
            grid: this.grid,
            colors: this.colors,
            hints: this.hints,
            updateGrid: this.updateGrid
        }
    },
    mounted() {
        // Generate the grid array with the correct number of rows and columns
        this.generateGrid();
    },
    watch: {
        // When the grid is updated, update the grid hints
        // Watch the stringified computed property so that we can compare the old and new grid (using the original data (array), newGrid and oldGrid are the identical)
        stringifiedGrid: {
            handler(stringNewGrid, stringOldGrid) {

                const newGrid = JSON.parse(stringNewGrid);
                const oldGrid = JSON.parse(stringOldGrid);

                // Retrieve the rows and columns that have changed
                const gridDiffs = this.getGridDifferences(newGrid, oldGrid);
                
                // Update the hints for these rows and columns
                this.updateHints(gridDiffs.rowsToUpdate, gridDiffs.columnsToUpdate);
            },
            deep: true
        }

    },
    methods: {
        // Generate the grid array with the correct number of rows and columns
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
            this.grid[rowIndex][columnIndex] = Math.floor(Math.random() * this.colors.length);
        },
        // Get the differences between the old and new grid
        getGridDifferences(newGrid, oldGrid) {
            let rowsToUpdate = [];
            let columnsToUpdate = [];
            for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
                for (let colIndex = 0; colIndex < newGrid[rowIndex].length; colIndex++) {
                    if (oldGrid.length === 0 || newGrid[rowIndex][colIndex] !== oldGrid[rowIndex][colIndex]) {

                        if(!rowsToUpdate.includes(rowIndex)) {
                            rowsToUpdate.push(rowIndex);
                        }
                        if(!columnsToUpdate.includes(colIndex)) {
                            columnsToUpdate.push(colIndex);
                        }
                    }
                }
            }
            return { rowsToUpdate, columnsToUpdate };
        },
        // Update the hints for the provided rows and columns 
        updateHints(rowsToUpdate, columnsToUpdate) {
            if(rowsToUpdate.length !== 0) {
                for (const rowIndex  of rowsToUpdate) {
                    this.hints.rows[rowIndex] = this.getHints(this.grid[rowIndex]);
                }
            }
            if(columnsToUpdate.length !== 0) {
                for (const columnIndex of columnsToUpdate) {
                    this.hints.columns[columnIndex] = this.getHints(this.getColumnCells(columnIndex));
                }
            }
        },
        // Get the cells in the provided column
        getColumnCells(columnIndex) {
            return this.grid.map(row => row[columnIndex]);
        },
        getHints(cells) {
            const cellHints = [];
            for (const color in this.colors) {
                const colorHints = {
                    number: 0,
                    contiguous: true
                };

                
                let lastIndex = null;

                for (const cellIndex in cells) {
                    if (cells[cellIndex] == color) {
                        colorHints.number++;

                        // Check if the cell is contiguous
                        if (lastIndex !== null) {
                            if (cellIndex - lastIndex !== 1) {
                                colorHints.contiguous = false;
                            }
                        }

                        lastIndex = cellIndex;
                    }
                }

                cellHints.push(colorHints);
            }
            return cellHints;
        }
    }
}
</script>