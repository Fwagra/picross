<template>
    <div class="boardgame">
        <div class="head">
            <div class="cell faux-cell" :style="fauxCellStyles"></div>
            <div class="hints"  :style="headStyles"> 
                <Hints :type="'col'" class="col-hints"  v-for="(hint, hintIndex) in hints.columns" :hint="hint" :error="errors.columns[hintIndex]" :key="hintIndex"></Hints>
            </div>
        </div>
        <div class="main">
            <div class="hints">
                <Hints @updateFauxCell="updateFauxCell" :type="'row'" v-for="(hint, hintIndex) in hints.rows" :key="hintIndex"  class="row-hints" :hint="hint" :error="errors.rows[hintIndex]"></Hints>
            </div>
            <div class="grid"  @mouseleave="this.release" :style="gridStyles">

                <template v-for="(row, rowIndex) in this.grid" :key="rowIndex">
                    <Cell 
                    v-for="(column, columnIndex) in row"
                    @updateCell="updateGrid"  
                    @press="press"
                    @release="release"
                    :rowIndex="rowIndex" 
                    :columnIndex="columnIndex" 
                    :totalRows="gridRows"
                    :totalColumns="gridColumns"
                    :pressed="pressed"
                    :color="this.grid[rowIndex][columnIndex]" 
                    :key="columnIndex"></Cell>
                </template>
         </div>
        </div>
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
    data() {
        return {
            fauxCellWidth: 0,
            pressed: false,
        }
    },
    computed: {
        gridStyles() {
            return {
                gridTemplateColumns: `repeat(${this.gridColumns}, 1fr)`,
                gridTemplateRows: `repeat(${this.gridRows}, 1fr)`,
                flex: this.gridColumns,
            }
        },
        fauxCellStyles() {
            return {
                width: this.fauxCellWidth + 'px',
            }
        },
        headStyles() {
            return {
                flex: this.gridColumns,
            }
        }
    },


    methods: {
       updateFauxCell(width) {
            this.fauxCellWidth = width;
        },
        press() {
            this.pressed = true;
        },
        release() {
            this.pressed = false;
        },
    }
}
</script>

<style scoped>
.grid {
    display: grid;
    user-select: none;
    border-top: 2px dashed var(--grid-separations);
    border-left: 2px dashed var(--grid-separations);
}
.col-hints,
.row-hints {
    user-select: none;
    
}
.head {
    display: flex;
}
.main {
    display: flex;
}

.head .hints,
.main .hints {
    flex: 1;
    display: flex;
    justify-content: space-around;
}
.main .hints {
    flex-direction: column;
}
</style>