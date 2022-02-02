<template>
    <div class="board-wrapper">
        <div class="boardgame">
            <div class="head">
                <!-- <div class="hints"> -->
                    <div class="cell faux-cell" ><Hints class="col-hints" type='col' :hint="hints.columns[0]"></Hints></div>
                    <Hints @updateFauxCell="updateFauxCell" type="row" v-for="(hint, hintIndex) in hints.rows" :key="hintIndex"  class="row-hints" :hint="hint" :error="errors.rows[hintIndex]"></Hints>
                <!-- </div> -->
            </div>
            <div class="main">

                <div class="hints"  :style="headStyles"> 
                    <Hints type="col" class="col-hints"  v-for="(hint, hintIndex) in hints.columns" :hint="hint" :error="errors.columns[hintIndex]" :key="hintIndex"></Hints>
                </div>
                <div class="grid"  @mouseleave="this.release" @touchmove="this.debouncedMobileDrag" :style="gridStyles">

                    <template v-for="(row, rowIndex) in this.grid" :key="rowIndex">
                        <Cell 
                        :ref="'cell-' + rowIndex + columnIndex"
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
        <div v-if="victory" class="blocker"></div>
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
    inject: [ 'grid', 'updateGrid', 'currentColor'],
    emits: ['updateGrid'],
    props: ['gridRows',  'gridColumns','colors', 'hints', 'errors', 'victory'],
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
        debounce(func, timeFrame) {
            var lastTime = 0;
            return function (...args) {
                var now = new Date();
                if (now - lastTime >= timeFrame) {
                    func(...args);
                    lastTime = now;
                }
            };
        },
        debouncedMobileDrag(e) {
            if(!this.victory) {
                this.debounce(this.mobileDrag, 200)(e);
            }
        },
        
        mobileDrag(e) {
            let position = e.touches[0];
            let el = document.elementFromPoint(position.clientX, position.clientY);
            let cell;
            for (let currentCell in this.$refs) {
                if (this.$refs[currentCell][0].$el === el) {
                    cell = this.$refs[currentCell][0];
                }
            }
            if (cell && (cell.color === '' || this.currentColor === '' )) {
                this.$emit('update-cell', cell.rowIndex, cell.columnIndex);
            }
        }
    }
}
</script>

<style scoped>
.board-wrapper {
    display: flex;
    user-select: none;
    justify-content: center;
    position: relative;
}
.grid {
    display: grid;
    user-select: none;
    border-top: 2px dashed var(--grid-separations);
    border-left: 2px dashed var(--grid-separations);
}
.col-hints,
.row-hints {
    user-select: none;
    padding: 3px;
    
}
.head,
.boardgame
 {
    display: flex;
}
.head .hints,
.head {
    flex-direction: column;
}
.head .hints .cell {
    flex: 1;
}
.faux-cell {
    visibility: hidden;
}
.head .hints,
.main .hints {
    flex: 1;
    display: flex;
    justify-content: space-around;
}
.head .hints {
    justify-content: flex-end;
}
.blocker {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 2;
    right: 0;
}

</style>