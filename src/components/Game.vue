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

<script setup>
import { ref, computed, provide, watch, onMounted } from 'vue';
import Grid from './Grid.vue';
import Tools from './Tools.vue';
import Modal from './Modal.vue';
import { checkSolvability } from '../solver.js';
import { getHints as buildLineHints, getHintsForColor } from '../hints.js';
import { decodeCompactPuzzle, decodeLegacyPuzzle, encodeCompactPuzzle } from '../puzzleUrl.js';
import { getAvailableDailyDateKeys, getTodayKey, isDailyPath, loadDailyForDate } from '../daily.js';

const emit = defineEmits(['daily-state']);

// --- État ---
const editMode = ref(true);
const dailyMode = ref(false);
const dailyDateKey = ref(null);
const dailyDateKeys = ref([]);
const hypothesisMode = ref(false);
const gridColumns = ref(5);
const gridRows = ref(5);
const grid = ref([]);
const correctGrid = ref([]);
const hints = ref({ rows: [], columns: [] });
const errors = ref({ rows: [], columns: [] });
const history = ref([]);
const colors = ref([]);
const currentColor = ref(0);
const shareLink = ref('');
const victory = ref(false);
const modalTitle = ref('');
const modalMessage = ref('');
const openModal = ref(false);
const gridBackup = ref([]);
const solvability = ref(null);
const solvability_loading = ref(false);
// Timer de debounce (valeur non réactive).
let solvability_debounce = null;

// --- Propriétés calculées ---
// On compare l'ancienne et la nouvelle grille via leur version stringifiée :
// les tableaux étant passés par référence, c'est le seul moyen de diffuser un diff.
const stringifiedGrid = computed(() => JSON.stringify(grid.value));
const stringifiedColors = computed(() => JSON.stringify(colors.value));
const isFilled = computed(() => grid.value.every(row => row.every(cell => cell !== '')));
const solvabilityLoading = computed(() => solvability_loading.value);
// `!== true` : les cases non encore évaluées restent `undefined` (tableau sparse)
// et ne doivent pas bloquer la détection de victoire.
const noErrors = computed(() =>
    errors.value.rows.every(error => error !== true)
    && errors.value.columns.every(error => error !== true)
);
// Position de la date courante dans la liste des daily jouables.
const dailyIndex = computed(() => dailyDateKeys.value.indexOf(dailyDateKey.value));
// Existe-t-il une grille daily plus ancienne (flèche gauche) ?
const canGoPreviousDaily = computed(() => dailyMode.value && dailyIndex.value > 0);
// Existe-t-il une grille daily plus récente (flèche droite) ?
const canGoNextDaily = computed(() =>
    dailyMode.value && dailyIndex.value !== -1 && dailyIndex.value < dailyDateKeys.value.length - 1
);

// --- Fourniture aux descendants (refs réactives + fonctions) ---
provide('editMode', editMode);
provide('gridColumns', gridColumns);
provide('gridRows', gridRows);
provide('grid', grid);
provide('colors', colors);
provide('currentColor', currentColor);
provide('hints', hints);
provide('updateGrid', updateGrid);
provide('updateColors', updateColors);
provide('updateCurrentColor', updateCurrentColor);

// --- Watchers ---
// Quand la grille change, on met à jour les indices des lignes/colonnes touchées.
watch(stringifiedGrid, (stringNewGrid, stringOldGrid) => {
    const newGrid = JSON.parse(stringNewGrid);
    const oldGrid = JSON.parse(stringOldGrid);
    const gridDiffs = getGridDifferences(newGrid, oldGrid);

    updateHints(gridDiffs.rowsToUpdate, gridDiffs.columnsToUpdate);

    if (!editMode.value && !hypothesisMode.value && isFilled.value && noErrors.value) {
        checkVictory();
    }

    if (editMode.value) {
        scheduleSolvabilityCheck();
    }
});

// Recalcule les indices quand les couleurs changent.
watch(stringifiedColors, () => {
    refreshHints();
});

watch(gridRows, (newRows, oldRows) => {
    if (editMode.value) {
        const difference = newRows - oldRows;
        if (difference > 0) {
            for (let i = 0; i < difference; i++) {
                grid.value.push([...Array(gridColumns.value).fill('')]);
            }
        } else if (difference < 0) {
            for (let i = 0; i < Math.abs(difference); i++) {
                grid.value.pop();
            }
        }
        // Si la taille de la grille change, on force la mise à jour des indices.
        refreshHints();
    }
});

watch(gridColumns, (newColumns, oldColumns) => {
    if (editMode.value) {
        const difference = newColumns - oldColumns;
        if (difference > 0) {
            for (let i = 0; i < grid.value.length; i++) {
                grid.value[i] = [...grid.value[i], ...Array(difference).fill('')];
            }
        } else if (difference < 0) {
            for (let i = 0; i < grid.value.length; i++) {
                grid.value[i].splice(difference);
            }
        }
        // Si la taille de la grille change, on force la mise à jour des indices.
        refreshHints();
    }
});

// --- Cycle de vie ---
onMounted(() => {
    // Détermine si on joue ou si on édite.
    checkMode();
    // Génère le tableau de la grille aux bonnes dimensions.
    generateGrid();
    emitDailyState();
});

// --- Fonctions ---
function checkMode() {
    const params = new URLSearchParams(document.location.search);

    // Nouveau format compact : ?p=  (voir loadCompactPuzzle)
    if (params.has('p')) {
        if (loadCompactPuzzle()) {
            editMode.value = false;
        } else {
            fallbackToEditMode();
        }
    // Ancien format historique : ?g=  (conservé pour la rétro-compatibilité)
    } else if (params.has('g')) {
        if (loadLegacyPuzzle()) {
            editMode.value = false;
        } else {
            fallbackToEditMode();
        }
    } else if (isDailyPath()) {
        if (loadDailyPuzzle()) {
            editMode.value = false;
            dailyMode.value = true;
        } else {
            fallbackToEditMode('Aucun daily n\'est disponible pour aujourd\'hui. Tu peux créer une nouvelle grille.');
        }
    } else {
        editMode.value = true;
        colors.value.push(getRandomColor());
        colors.value.push(getRandomColor());
    }
}

function emitDailyState() {
    emit('daily-state', {
        dailyMode: dailyMode.value,
        dailyDateKey: dailyDateKey.value,
        canGoPreviousDaily: canGoPreviousDaily.value,
        canGoNextDaily: canGoNextDaily.value,
    });
}

// Retire ?p= / ?g= pour qu'un refresh ne relance pas le mode jeu.
function clearPuzzleQuery() {
    const url = new URL(window.location.href);
    url.searchParams.delete('p');
    url.searchParams.delete('g');
    const search = url.searchParams.toString();
    const path = isDailyPath(url.pathname) ? '/' : url.pathname;
    window.history.replaceState({}, '', path + (search ? `?${search}` : '') + url.hash);
}

function fallbackToEditMode(message = 'Ce lien de picross est invalide ou corrompu. Tu peux créer une nouvelle grille.') {
    editMode.value = true;
    dailyMode.value = false;
    dailyDateKey.value = null;
    clearPuzzleQuery();
    emitDailyState();
    if (colors.value.length === 0) {
        colors.value.push(getRandomColor());
        colors.value.push(getRandomColor());
    }
    modalTitle.value = 'Oups !';
    modalMessage.value = message;
    openModal.value = true;
}

function applyPuzzle(puzzle) {
    colors.value = puzzle.colors;
    correctGrid.value = puzzle.grid;
    gridRows.value = puzzle.gridRows;
    gridColumns.value = puzzle.gridColumns;
    hints.value = puzzle.hints;
}

// Décode le format compact (?p=). Retourne true si le chargement a réussi.
function loadCompactPuzzle() {
    try {
        applyPuzzle(decodeCompactPuzzle(document.location.href));
        return true;
    } catch (e) {
        console.error('Impossible de charger le picross compact', e);
        return false;
    }
}

// Décode l'ancien format (?g=). Retourne true si le chargement a réussi.
function loadLegacyPuzzle() {
    try {
        applyPuzzle(decodeLegacyPuzzle(document.location.href));
        return true;
    } catch (e) {
        console.error('Impossible de charger le picross legacy', e);
        return false;
    }
}

// Charge le daily du jour depuis le calendrier embarqué.
function loadDailyPuzzle() {
    dailyDateKeys.value = getAvailableDailyDateKeys();
    return loadDailyForKey(getTodayKey());
}

// Charge (sans réinitialiser) la grille daily d'une date donnée.
// La date affichée est la date réelle de la grille (resolvedDateKey).
function loadDailyForKey(dateKey) {
    try {
        const puzzle = loadDailyForDate(dateKey);
        applyPuzzle(puzzle);
        dailyDateKey.value = puzzle.resolvedDateKey;
        return true;
    } catch (e) {
        console.error('Impossible de charger le daily', e);
        return false;
    }
}

// Navigue vers une autre date daily : recharge la grille et remet à zéro la partie.
function navigateDaily(dateKey) {
    if (!loadDailyForKey(dateKey)) {
        return;
    }
    resetPlayState();
    emitDailyState();
}

// Flèche gauche : grille daily précédente (plus ancienne).
function goToPreviousDaily() {
    if (canGoPreviousDaily.value) {
        navigateDaily(dailyDateKeys.value[dailyIndex.value - 1]);
    }
}

// Flèche droite : grille daily suivante (plus récente).
function goToNextDaily() {
    if (canGoNextDaily.value) {
        navigateDaily(dailyDateKeys.value[dailyIndex.value + 1]);
    }
}

// Remet la partie à zéro pour la nouvelle grille daily chargée.
function resetPlayState() {
    victory.value = false;
    openModal.value = false;
    history.value = [];
    hypothesisMode.value = false;
    gridBackup.value = [];
    errors.value = { rows: [], columns: [] };
    currentColor.value = 0;
    grid.value = [];
    generateGrid();
}

// Génère le tableau de la grille aux bonnes dimensions.
function generateGrid() {
    for (let i = 0; i < gridRows.value; i++) {
        grid.value[i] = [];
        for (let j = 0; j < gridColumns.value; j++) {
            grid.value[i][j] = '';
        }
    }
}

function updateGrid(rowIndex, columnIndex) {
    const oldValue = grid.value[rowIndex][columnIndex];
    grid.value[rowIndex][columnIndex] = currentColor.value;

    // Une action = une entrée (même format que le remplissage groupé).
    history.value.push({
        cells: [{ rowIndex, columnIndex, oldValue }],
    });
}

function moveBackFromHistory() {
    if (history.value.length > 0 && victory.value === false) {
        const lastMove = history.value.pop();
        for (const cell of lastMove.cells) {
            grid.value[cell.rowIndex][cell.columnIndex] = cell.oldValue;
        }
    }
}

// Retourne les lignes et colonnes qui diffèrent entre l'ancienne et la nouvelle grille.
function getGridDifferences(newGrid, oldGrid) {
    const rowsToUpdate = [];
    const columnsToUpdate = [];
    for (let rowIndex = 0; rowIndex < newGrid.length; rowIndex++) {
        for (let colIndex = 0; colIndex < newGrid[rowIndex].length; colIndex++) {
            if (oldGrid.length === 0 || oldGrid[rowIndex] === undefined || newGrid[rowIndex][colIndex] !== oldGrid[rowIndex][colIndex]) {
                if (!rowsToUpdate.includes(rowIndex)) {
                    rowsToUpdate.push(rowIndex);
                }
                if (!columnsToUpdate.includes(colIndex)) {
                    columnsToUpdate.push(colIndex);
                }
            }
        }
    }
    return { rowsToUpdate, columnsToUpdate };
}

// Met à jour les indices des lignes et colonnes fournies.
function updateHints(rowsToUpdate, columnsToUpdate) {
    if (editMode.value) {
        if (rowsToUpdate.length !== 0) {
            for (const rowIndex of rowsToUpdate) {
                hints.value.rows[rowIndex] = getHints(grid.value[rowIndex]);
            }
        }
        if (columnsToUpdate.length !== 0) {
            for (const columnIndex of columnsToUpdate) {
                hints.value.columns[columnIndex] = getHints(getColumnCells(columnIndex));
            }
        }
    } else {
        checkHints({ rows: rowsToUpdate, columns: columnsToUpdate });
    }
}

function refreshHints() {
    if (editMode.value) {
        for (let rowIndex = 0; rowIndex < gridRows.value; rowIndex++) {
            hints.value.rows[rowIndex] = getHints(grid.value[rowIndex]);
        }
        for (let columnIndex = 0; columnIndex < gridColumns.value; columnIndex++) {
            hints.value.columns[columnIndex] = getHints(getColumnCells(columnIndex));
        }

        // Retire les indices des lignes/colonnes supprimées.
        hints.value.rows = hints.value.rows.slice(0, gridRows.value);
        hints.value.columns = hints.value.columns.slice(0, gridColumns.value);

        scheduleSolvabilityCheck();
    }
}

// Vérifie si les coups du joueur correspondent aux indices.
function checkHints(rowsAndColumns) {
    for (const type in rowsAndColumns) {
        const arrayToCheck = rowsAndColumns[type];

        if (arrayToCheck.length !== 0) {
            for (const arrayIndex of arrayToCheck) {
                errors.value[type][arrayIndex] = false;

                for (const color in hints.value[type][arrayIndex]) {
                    const actualGridElement = type === 'rows' ? grid.value[arrayIndex] : getColumnCells(arrayIndex);
                    const actualColors = getHintsForColor(Number(color), actualGridElement);

                    // Détermine si le nombre doit être affiché (on masque l'indice quand
                    // les couleurs placées correspondent au motif attendu).
                    if (
                        actualColors.number === hints.value[type][arrayIndex][color].number &&
                        actualColors.contiguous === hints.value[type][arrayIndex][color].contiguous
                    ) {
                        hints.value[type][arrayIndex][color].correct = true;
                    } else {
                        hints.value[type][arrayIndex][color].correct = false;
                    }

                    // Détermine si la ligne contient une erreur.
                    if (actualColors.number > hints.value[type][arrayIndex][color].number) {
                        errors.value[type][arrayIndex] = true;
                    } else if (actualColors.number === hints.value[type][arrayIndex][color].number && hints.value[type][arrayIndex][color].contiguous !== actualColors.contiguous) {
                        errors.value[type][arrayIndex] = true;
                    }
                }
            }
        }
    }
}

// Retourne les cellules de la colonne demandée.
function getColumnCells(columnIndex) {
    return grid.value.map(row => row[columnIndex]);
}

function getHints(cells) {
    return buildLineHints(cells, colors.value.length);
}

function updateColors(colorIndex, newColor) {
    colors.value[colorIndex] = newColor;
}

function updateCurrentColor(color) {
    if (color === '' || (color >= 0 && color < colors.value.length)) {
        currentColor.value = color;
    }
}

function addColor() {
    colors.value.push(getRandomColor());
    updateCurrentColor(colors.value.length - 1);
}

// Retire la dernière couleur de la liste.
function removeColor() {
    const removedColor = colors.value.length - 1;
    colors.value.pop();
    removeColorFromGrid(removedColor);
    updateCurrentColor(colors.value.length - 1);
}

// Retire la couleur fournie de la grille.
function removeColorFromGrid(color) {
    const target = Number(color);
    for (let rowIndex = 0; rowIndex < grid.value.length; rowIndex++) {
        for (let colIndex = 0; colIndex < grid.value[rowIndex].length; colIndex++) {
            if (Number(grid.value[rowIndex][colIndex]) === target && grid.value[rowIndex][colIndex] !== '') {
                grid.value[rowIndex][colIndex] = '';
            }
        }
    }
}

function updateRows(newRowsString) {
    const newRowsNumber = Number(newRowsString);
    if (newRowsNumber >= 3 && newRowsNumber <= 15) {
        gridRows.value = newRowsNumber;
    }
}

function updateCols(newColsString) {
    const newColsNumber = Number(newColsString);
    if (newColsNumber >= 3 && newColsNumber <= 15) {
        gridColumns.value = newColsNumber;
    }
}

function fillColor() {
    const cells = [];
    for (let rowIndex = 0; rowIndex < grid.value.length; rowIndex++) {
        for (let colIndex = 0; colIndex < grid.value[rowIndex].length; colIndex++) {
            if (grid.value[rowIndex][colIndex] === '') {
                cells.push({
                    rowIndex,
                    columnIndex: colIndex,
                    oldValue: '',
                });
                grid.value[rowIndex][colIndex] = currentColor.value;
            }
        }
    }
    // Un seul undo pour tout le seau.
    if (cells.length > 0) {
        history.value.push({ cells });
    }
}

function getShareLink() {
    return encodeCompactPuzzle({
        grid: grid.value,
        gridColumns: gridColumns.value,
        colors: colors.value,
        origin: window.location.origin,
    });
}

function updateShareLink() {
    shareLink.value = getShareLink();
}

function getRandomColor() {
    let color = '';
    while (color.length < 6) {
        color = Math.floor(Math.random() * 16777215).toString(16);
    }
    return '#' + color;
}

function checkVictory() {
    if (JSON.stringify(grid.value) === JSON.stringify(correctGrid.value)) {
        victory.value = true;
        // Clic fantôme sur l'overlay de la modale seulement sur mobile ; le setTimeout l'évite.
        // TODO : trouver la cause du clic fantôme sur mobile.
        setTimeout(() => {
            openModal.value = true;
        }, 200);

        modalTitle.value = 'Bravo !';
        modalMessage.value = 'Tu as réussi à résoudre ce picross !';
    } else {
        openModal.value = true;
        modalTitle.value = 'Dommage !';
        modalMessage.value = 'Toutes les cases sont remplies, mais elles ne correspondent pas à la solution. Tu peux fermer cette fenêtre et tenter de corriger !';
    }
}

function scheduleSolvabilityCheck() {
    if (!editMode.value || !isFilled.value) {
        solvability.value = null;
        solvability_loading.value = false;
        return;
    }

    solvability_loading.value = true;

    if (solvability_debounce) {
        clearTimeout(solvability_debounce);
    }

    solvability_debounce = setTimeout(() => {
        solvability.value = checkSolvability({
            rows: gridRows.value,
            columns: gridColumns.value,
            hints: hints.value,
            colorCount: colors.value.length,
        });
        solvability_loading.value = false;
    }, 300);
}

function switchMode() {
    editMode.value = true;
    dailyMode.value = false;
    dailyDateKey.value = null;
    victory.value = false;
    clearPuzzleQuery();
    emitDailyState();
}

function enableHypothesisMode() {
    hypothesisMode.value = true;
    // Sauvegarde la grille courante.
    gridBackup.value = JSON.parse(JSON.stringify(grid.value));
}

function disableHypothesisMode() {
    hypothesisMode.value = false;
    // Restaure la grille.
    grid.value = JSON.parse(JSON.stringify(gridBackup.value));
    // Vide l'historique.
    history.value = [];
}

function validateHypothesis() {
    hypothesisMode.value = false;
    // Vide la sauvegarde.
    gridBackup.value = [];
    // Remplace la grille par elle-même pour déclencher le watcher de victoire.
    grid.value = JSON.parse(JSON.stringify(grid.value));
}

// Exposé pour le parent (App) qui pilote la navigation daily via un ref de composant.
defineExpose({ goToPreviousDaily, goToNextDaily });
</script>