<template>
    <Grid @updateCell="updateGrid" :gridRows="gridRows" :gridColumns="gridColumns"></Grid>
    <Tools :colors='colors' 
           :currentColor="currentColor" 
           :gridRows="gridRows"
           :gridColumns="gridColumns"
           :isFilled="isFilled"
           :shareLink="shareLink"
           @removeColor="removeColor" 
           @addColor="addColor" 
           @updateRows="updateRows"
           @updateCols="updateCols"
           @fillColor="fillColor"
    ></Tools>
</template>

<script>

import Grid from './Grid.vue';
import Tools from './Tools.vue';
import JSONCrush from 'jsoncrush';

export default {
    components: {
        Grid,
        Tools
    },
    data() {
        return {
            editMode: true,
            gridColumns: 5,
            gridRows: 5,
            grid: [],
            hints: {
                rows: [],
                columns: [],
            },
            colors: ['#000', '#F0F'],
            currentColor: 0,
            shareLink: '',
        }
    },
    computed: {
        stringifiedGrid() {
            return JSON.stringify(this.grid);
        },
        stringifiedColors() {
            return JSON.stringify(this.colors);
        },
        isFilled() {
            return this.grid.every(row => row.every(cell => cell !== ''));
        },
    },
    provide() {
        return {
            editMode: this.editMode,
            gridColumns: this.gridColumns,
            gridRows: this.gridRows,
            grid: this.grid,
            colors: this.colors,
            currentColor: this.currentColor,
            hints: this.hints,
            updateGrid: this.updateGrid,
            updateColors: this.updateColors,
            updateCurrentColor: this.updateCurrentColor,
        }
    },
    mounted() {
        // Generate the grid array with the correct number of rows and columns
        this.generateGrid();
    },
    watch: {
        // When the grid is updated, update the grid hints
        // Watch the stringified computed property so that we can compare the old and new grid (using the original data (array), newGrid and oldGrid are the identical since objects are passed by reference)
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
        },
        stringifiedColors() {
            //Update the hints when the colors are updated
           this.refreshHints();  
        },
        gridRows(newRows, oldRows) {
            const difference = newRows - oldRows;

            if(difference > 0) {
                for(let i = 0; i < difference; i++) {
                    this.grid.push([...Array(this.gridColumns).fill('')]);
                }
            } else if(difference < 0) {
                for(let i = 0; i < Math.abs(difference); i++) {
                    this.grid.pop();
                }
            }
            // if the grid's size has changed, force the update of the hints
            this.refreshHints();
        },
        gridColumns(newColumns, oldColumns) {
            const difference = newColumns - oldColumns;
            console.log(difference);
            if(difference > 0) {
                for(let i = 0; i < this.grid.length; i++) {
                    this.grid[i] = [...this.grid[i], ...Array(difference).fill('')];
                }
            } else if(difference < 0) {
                for(let i = 0; i < this.grid.length; i++) {
                    this.grid[i].splice(difference);
                }
            }
            // if the grid's size has changed, force the update of the hints
            this.refreshHints();
        },
        isFilled(filled) {
            if(filled) {
                this.shareLink = this.getShareLink();
            }else {
                this.shareLink = '';
            }
        }

    },
    methods: {
        // Generate the grid array with the correct number of rows and columns
        generateGrid() {
            for (let i = 0; i < this.gridRows; i++) {
                this.grid[i] = [];
                for (let j = 0; j < this.gridColumns; j++) {
                    this.grid[i][j] = "";
                }
            }
        },
         updateGrid(rowIndex, columnIndex) {
            // Update the grid array with the new color
            this.grid[rowIndex][columnIndex] = this.currentColor;
        },
        // Get the differences between the old and new grid
        getGridDifferences(newGrid, oldGrid) {
            let rowsToUpdate = [];
            let columnsToUpdate = [];
            for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
                for (let colIndex = 0; colIndex < newGrid[rowIndex].length; colIndex++) {
                    if (oldGrid.length === 0 || oldGrid[rowIndex] === undefined || newGrid[rowIndex][colIndex] !== oldGrid[rowIndex][colIndex]) {

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
        refreshHints() {
            for (let rowIndex = 0; rowIndex < this.gridRows; rowIndex++) {
                this.hints.rows[rowIndex] = this.getHints(this.grid[rowIndex]);
            }
            for (let columnIndex = 0; columnIndex < this.gridColumns; columnIndex++) {
                this.hints.columns[columnIndex] = this.getHints(this.getColumnCells(columnIndex));
            }

            // Trim the hints from removed rows/columns
            this.hints.rows = this.hints.rows.slice(0, this.gridRows);
            this.hints.columns = this.hints.columns.slice(0, this.gridColumns);

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
        },
        updateColors(colorIndex, newColor) {
            this.colors[colorIndex] = newColor;
        },
        updateCurrentColor(color) {
            this.currentColor = color;
        },
        addColor() {
            this.colors.push("#" + Math.floor(Math.random()*16777215).toString(16));
            this.updateCurrentColor(this.colors.length - 1);
        },
        // Remove the last color from colors list
        removeColor() {
            const removedColor = this.colors.length - 1;
            this.colors.pop();
            this.removeColorFromGrid(removedColor);
            this.updateCurrentColor(this.colors.length - 1);
        },
        //Remove the provided color from the grid
        removeColorFromGrid(color) {
            for (const rowIndex in this.grid) {
                for (const colIndex in this.grid[rowIndex]) {
                    if (this.grid[rowIndex][colIndex] == color) {
                        this.grid[rowIndex][colIndex] = "";
                    }
                }
            }
        },
        updateRows(newRowsString) {
            const newRowsNumber = Number(newRowsString);
            if(newRowsNumber >= 3 && newRowsNumber <= 20) {
                this.gridRows = newRowsNumber;
            }
        },
        updateCols(newColsString) {
            const newColsNumber = Number(newColsString);
            if(newColsNumber >= 3 && newColsNumber <= 20) {
                this.gridColumns = newColsNumber;
            }
        },
        fillColor() {
            for (const rowIndex in this.grid) {
                for (const colIndex in this.grid[rowIndex]) {
                    if(this.grid[rowIndex][colIndex] === "") {
                        this.grid[rowIndex][colIndex] = this.currentColor;
                    }
                }
            }
        },
        getShareLink() {
    
            const data = {
                grid: this.grid,
                colors: this.colors,
                rows: this.gridRows,
                columns: this.gridColumns,
                hints: this.hints
            };

            // JSONCrush higly compresses a JSON string
            const encodedData = JSONCrush.crush(JSON.stringify(data));
            
            return `${window.location.origin}?g=${encodedData}`;
        
        }
   
    }
}
</script>