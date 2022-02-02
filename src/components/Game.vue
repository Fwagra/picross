<template>
    <Grid @updateCell="updateGrid" :gridRows="gridRows" :colors="colors" :gridColumns="gridColumns" :hints="hints" :errors="errors" :victory="victory"></Grid>
    <Tools :colors='colors' 
           :currentColor="currentColor" 
           :gridRows="gridRows"
           :gridColumns="gridColumns"
           :isFilled="isFilled"
           :shareLink="shareLink"
           :editMode="editMode"
           :victory="victory"
           @removeColor="removeColor" 
           @addColor="addColor" 
           @updateRows="updateRows"
           @updateCols="updateCols"
           @fillColor="fillColor"
           @updateShareLink="updateShareLink"
           @switchMode="switchMode"
           @clickHistory="moveBackFromHistory"
    ></Tools>
    <Modal :title="modalTitle" :message="modalMessage"  @close="openModal = !openModal"  :type="'message'" v-if="openModal"></Modal>
</template>

<script>

import Grid from './Grid.vue';
import Tools from './Tools.vue';
import Modal from './Modal.vue';
import JSONCrush from 'jsoncrush';
import { computed } from 'vue';

export default {
    components: {
        Grid,
        Tools,
        Modal
    },
    data() {
        return {
            editMode: true,
            gridColumns: 5,
            gridRows: 5,
            grid: [],
            correctGrid: [],
            hints: {
                rows: [],
                columns: [],
            },
            errors: {
                rows: [],
                columns: [],
            },
            history: [],
            colors: [],
            currentColor: 0,
            shareLink: '',
            victory: false,
            modalTitle: '',
            modalMessage: '',
            openModal: false,
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
        noErrors() {
            return this.errors.rows.every(error => error === false) && this.errors.columns.every(error => error === false);
        },
    },
    provide() {
        return {
            editMode: this.editMode,
            gridColumns: this.gridColumns,
            gridRows: this.gridRows,
            grid: this.grid,
            colors: computed(() => this.colors),
            currentColor: computed(() => this.currentColor),
            hints: this.hints,
            updateGrid: this.updateGrid,
            updateColors: this.updateColors,
            updateCurrentColor: this.updateCurrentColor,
        }
    },
    mounted() {
        // Check if we are playing or editing
        this.checkMode();
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

                if (!this.editMode && this.isFilled && this.noErrors) {
                    this.checkVictory();
                }
            },
            deep: true
        },
        stringifiedColors() {
            //Update the hints when the colors are updated
           this.refreshHints();  
        },
        gridRows(newRows, oldRows) {
            if(this.editMode) {
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
            }
        },
        gridColumns(newColumns, oldColumns) {
            if(this.editMode) {

                const difference = newColumns - oldColumns;
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
            }
        },

    },
    methods: {
        checkMode() {
            const params =  new URLSearchParams(document.location.search);
            this.editMode = !params.has('g');

            if(!this.editMode) {
                let dataURL = document.location.href.split('?g=')[1];
                const data = JSON.parse(JSONCrush.uncrush(decodeURI(dataURL)));
                this.correctGrid = data.grid;
                this.gridRows = data.rows;
                this.gridColumns = data.columns;
                this.colors = data.colors;
                this.hints = data.hints;
            } else {
                this.colors.push(this.getRandomColor());
                this.colors.push(this.getRandomColor());
            }
        },
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
            const oldValue = this.grid[rowIndex][columnIndex];
            // Update the grid array with the new color
            this.grid[rowIndex][columnIndex] = this.currentColor;

            // Update the history
            this.history.push({
                rowIndex: rowIndex,
                columnIndex: columnIndex,
                color: this.currentColor,
                oldValue: oldValue,
            });
        },
        moveBackFromHistory() {
            if(this.history.length > 0 && this.victory === false) {
                const lastMove = this.history.pop();
                this.grid[lastMove.rowIndex][lastMove.columnIndex] = lastMove.oldValue;
            }
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
            if(this.editMode) {

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
            }else {
                this.checkHints({rows: rowsToUpdate, columns: columnsToUpdate});
            }
        },
        refreshHints() {
            if(this.editMode) {

                for (let rowIndex = 0; rowIndex < this.gridRows; rowIndex++) {
                    this.hints.rows[rowIndex] = this.getHints(this.grid[rowIndex]);
                }
                for (let columnIndex = 0; columnIndex < this.gridColumns; columnIndex++) {
                    this.hints.columns[columnIndex] = this.getHints(this.getColumnCells(columnIndex));
                }

                // Trim the hints from removed rows/columns
                this.hints.rows = this.hints.rows.slice(0, this.gridRows);
                this.hints.columns = this.hints.columns.slice(0, this.gridColumns);
            }

        },
        // Check if the player's moves match the hints
        checkHints(rowsAndColumns) {

            for (const type in rowsAndColumns) {
                const arrayToCheck = rowsAndColumns[type];

                if(arrayToCheck.length !== 0) {
                    for (const arrayIndex  of arrayToCheck) {

                    this.errors[type][arrayIndex] = false;


                    for(const color in this.hints[type][arrayIndex]) {
                        const actualGridElement = type === 'rows' ? this.grid[arrayIndex] : this.getColumnCells(arrayIndex);
                        const actualColors = this.getHintsForColor(color, actualGridElement);

                        // Debug log
                        // console.log(type + " " + arrayIndex + " color" + color + " actual : " + actualColors.number + " expected : " + this.hints[type][arrayIndex][color].number);

                        // Determine if the number must be displayed (we hide the hints if the colors are placed in a pattern that matchs the hints)
                        if(
                            actualColors.number === this.hints[type][arrayIndex][color].number &&
                            actualColors.contiguous === this.hints[type][arrayIndex][color].contiguous
                        ) {
                            this.hints[type][arrayIndex][color].correct = true;
                        } else {
                            this.hints[type][arrayIndex][color].correct = false;
                        }

                        // Determine if the line contains an error
                        if(actualColors.number > this.hints[type][arrayIndex][color].number) {
                            this.errors[type][arrayIndex] = true;
                        } else if(actualColors.number === this.hints[type][arrayIndex][color].number && this.hints[type][arrayIndex][color].contiguous !== actualColors.contiguous){
                            this.errors[type][arrayIndex] = true;
                        }
                    }
                }
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
                cellHints.push(this.getHintsForColor(color, cells));
            }
            return cellHints;
        },
        getHintsForColor(color, cells) {

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

            return colorHints;
        },
        updateColors(colorIndex, newColor) {
            this.colors[colorIndex] = newColor;
        },
        updateCurrentColor(color) {
            this.currentColor = color;
        },
        addColor() {
            this.colors.push(this.getRandomColor());
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
            const encodedData = encodeURI(JSONCrush.crush(JSON.stringify(data)));
            return `${window.location.origin}?g=${encodedData}`;
        
        },
        updateShareLink() {
            this.shareLink = this.getShareLink();
        },
        getRandomColor() {
            let color = "";

            while(color.length < 6) {
                color = Math.floor(Math.random()*16777215).toString(16);
                
            }
            
            return '#' + color;
        },
        checkVictory() {
            if(JSON.stringify(this.grid) === JSON.stringify(this.correctGrid)) {
                this.victory = true;
                this.openModal = true;

                this.modalTitle = "Bravo !";
                this.modalMessage = "Tu as réussi à résoudre ce picross !";
            } else {
                this.openModal = true;
                this.modalTitle = "Dommage !";
                this.modalMessage = "Toutes les cases sont remplies, mais elles ne correspondent pas à la solution. Tu peux fermer cette fenêtre et tenter de corriger !";
            }
        },
        switchMode() {
            this.editMode = true;
            this.victory = false;
        }
   
    }
}
</script>