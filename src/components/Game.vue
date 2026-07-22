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

<script>

import Grid from './Grid.vue';
import Tools from './Tools.vue';
import Modal from './Modal.vue';
import { computed } from 'vue';
import { checkSolvability } from '../solver.js';
import { computeHints as buildHints, getHints as buildLineHints, getHintsForColor } from '../hints.js';
import { decodeCompactPuzzle, decodeLegacyPuzzle, encodeCompactPuzzle } from '../puzzleUrl.js';

export default {
    components: {
        Grid,
        Tools,
        Modal
    },
    data() {
        return {
            editMode: true,
            hypothesisMode: false,
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
            gridBackup: [],
            solvability: null,
            solvability_loading: false,
            solvability_debounce: null,
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
        solvabilityLoading() {
            return this.solvability_loading;
        },
        // `!== true` : les cases non encore évaluées restent `undefined` (tableau sparse)
        // et ne doivent pas bloquer la détection de victoire.
        noErrors() {
            return this.errors.rows.every(error => error !== true)
                && this.errors.columns.every(error => error !== true);
        },
    },
    provide() {
        return {
            editMode: this.editMode,
            gridColumns: this.gridColumns,
            gridRows: this.gridRows,
            grid: computed(() => this.grid),
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

                if (!this.editMode && !this.hypothesisMode && this.isFilled && this.noErrors) {
                    this.checkVictory();
                }

                if (this.editMode) {
                    this.scheduleSolvabilityCheck();
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
            const params = new URLSearchParams(document.location.search);

            // Nouveau format compact : ?p=  (voir loadCompactPuzzle)
            if (params.has('p')) {
                if (this.loadCompactPuzzle()) {
                    this.editMode = false;
                } else {
                    this.fallbackToEditMode();
                }
            // Ancien format historique : ?g=  (conservé pour la rétro-compatibilité)
            } else if (params.has('g')) {
                if (this.loadLegacyPuzzle()) {
                    this.editMode = false;
                } else {
                    this.fallbackToEditMode();
                }
            } else {
                this.editMode = true;
                this.colors.push(this.getRandomColor());
                this.colors.push(this.getRandomColor());
            }
        },
        // Retire ?p= / ?g= pour qu'un refresh ne relance pas le mode jeu.
        clearPuzzleQuery() {
            const url = new URL(window.location.href);
            url.searchParams.delete('p');
            url.searchParams.delete('g');
            const search = url.searchParams.toString();
            window.history.replaceState({}, '', url.pathname + (search ? `?${search}` : '') + url.hash);
        },
        fallbackToEditMode() {
            this.editMode = true;
            this.clearPuzzleQuery();
            if (this.colors.length === 0) {
                this.colors.push(this.getRandomColor());
                this.colors.push(this.getRandomColor());
            }
            this.modalTitle = 'Oups !';
            this.modalMessage = 'Ce lien de picross est invalide ou corrompu. Tu peux créer une nouvelle grille.';
            this.openModal = true;
        },
        // Décode le format compact (?p=). Retourne true si le chargement a réussi.
        loadCompactPuzzle() {
            try {
                const puzzle = decodeCompactPuzzle(document.location.href);
                this.colors = puzzle.colors;
                this.correctGrid = puzzle.grid;
                this.gridRows = puzzle.gridRows;
                this.gridColumns = puzzle.gridColumns;
                this.hints = puzzle.hints;
                return true;
            } catch (e) {
                console.error('Impossible de charger le picross compact', e);
                return false;
            }
        },
        // Décode l'ancien format (?g=). Retourne true si le chargement a réussi.
        loadLegacyPuzzle() {
            try {
                const puzzle = decodeLegacyPuzzle(document.location.href);
                this.correctGrid = puzzle.grid;
                this.gridRows = puzzle.gridRows;
                this.gridColumns = puzzle.gridColumns;
                this.colors = puzzle.colors;
                this.hints = puzzle.hints;
                return true;
            } catch (e) {
                console.error('Impossible de charger le picross legacy', e);
                return false;
            }
        },
        // Recalcule les indices (lignes et colonnes) à partir d'une grille de solution
        computeHints(grid) {
            return buildHints(grid, this.colors.length);
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

                this.scheduleSolvabilityCheck();
            }

        },
        // Check if the player's moves match the hints
        checkHints(rowsAndColumns) {

            for (const type in rowsAndColumns) {
                const arrayToCheck = rowsAndColumns[type];

                if(arrayToCheck.length !== 0) {
                    for (const arrayIndex  of arrayToCheck) {

                    this.errors[type][arrayIndex] = false;


                    for (const color in this.hints[type][arrayIndex]) {
                        const actualGridElement = type === 'rows' ? this.grid[arrayIndex] : this.getColumnCells(arrayIndex);
                        const actualColors = getHintsForColor(Number(color), actualGridElement);

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
            return buildLineHints(cells, this.colors.length);
        },
        updateColors(colorIndex, newColor) {
            this.colors[colorIndex] = newColor;
        },
        updateCurrentColor(color) {
            if (color === '' || (color >= 0 && color < this.colors.length)) {
                this.currentColor = color;
            }
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
            const target = Number(color);
            for (let rowIndex = 0; rowIndex < this.grid.length; rowIndex++) {
                for (let colIndex = 0; colIndex < this.grid[rowIndex].length; colIndex++) {
                    if (Number(this.grid[rowIndex][colIndex]) === target && this.grid[rowIndex][colIndex] !== '') {
                        this.grid[rowIndex][colIndex] = '';
                    }
                }
            }
        },
        updateRows(newRowsString) {
            const newRowsNumber = Number(newRowsString);
            if (newRowsNumber >= 3 && newRowsNumber <= 15) {
                this.gridRows = newRowsNumber;
            }
        },
        updateCols(newColsString) {
            const newColsNumber = Number(newColsString);
            if (newColsNumber >= 3 && newColsNumber <= 15) {
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
            return encodeCompactPuzzle({
                grid: this.grid,
                gridColumns: this.gridColumns,
                colors: this.colors,
                origin: window.location.origin,
            });
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
                // Ghost click on modal overlay only on mobile. The setTimeout prevents it.
                // TODO : Find why there's a ghost click on mobile
                setTimeout(() => {
                    this.openModal = true;
                }, 200);

                this.modalTitle = "Bravo !";
                this.modalMessage = "Tu as réussi à résoudre ce picross !";
            } else {
                this.openModal = true;
                this.modalTitle = "Dommage !";
                this.modalMessage = "Toutes les cases sont remplies, mais elles ne correspondent pas à la solution. Tu peux fermer cette fenêtre et tenter de corriger !";
            }
        },
        scheduleSolvabilityCheck() {
            if (!this.editMode || !this.isFilled) {
                this.solvability = null;
                this.solvability_loading = false;
                return;
            }

            this.solvability_loading = true;

            if (this.solvability_debounce) {
                clearTimeout(this.solvability_debounce);
            }

            this.solvability_debounce = setTimeout(() => {
                this.solvability = checkSolvability({
                    rows: this.gridRows,
                    columns: this.gridColumns,
                    hints: this.hints,
                    colorCount: this.colors.length
                });
                this.solvability_loading = false;
            }, 300);
        },
        switchMode() {
            this.editMode = true;
            this.victory = false;
            this.clearPuzzleQuery();
        },
        enableHypothesisMode() {
            this.hypothesisMode = true;

            // Save the current grid
            this.gridBackup = JSON.parse(JSON.stringify(this.grid));
        },
        disableHypothesisMode() {
            this.hypothesisMode = false;

            // Restore the grid
            this.grid = JSON.parse(JSON.stringify(this.gridBackup));

            // Dump the history
            this.history = [];
        },
        validateHypothesis() {
            this.hypothesisMode = false;

            // Dump the backup
            this.gridBackup = [];

            // Replace the grid by itself just to trigger the victory watcher
            this.grid = JSON.parse(JSON.stringify(this.grid));

        },
   
    }
}
</script>