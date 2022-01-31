<template>
    <div  :class="cellClasses" class="cell grid-cell" v-touch:tap="this.updateCell" v-touch:press="this.press" v-touch:release="this.release" @mouseover="this.drag" :style="style"></div>
</template>

<script>
export default {
    inject: ['colors'],
    props: ['color', 'rowIndex', 'columnIndex', 'totalRows', 'totalColumns', 'pressed'],
    computed: {
        style() {
            return {
                backgroundColor: this.colors[this.color]
            }
        },
        cellClasses() {
            return  {
                col5: (this.columnIndex +1) % 5 === 0 && this.columnIndex + 1 < this.totalColumns, 
                row5: (this.rowIndex +1) % 5 === 0 && this.rowIndex + 1 < this.totalRows,
            }
        }
    },

    methods: {
        drag() {
            if(this.pressed && this.color === '') {
                this.$emit('update-cell', this.rowIndex, this.columnIndex)
            }
        },
        updateCell() {
            this.$emit('release');
            this.$emit('update-cell', this.rowIndex, this.columnIndex);
        },
        press() {
            this.$emit('press');
            this.$emit('update-cell', this.rowIndex, this.columnIndex);

        },
        release() {
            this.$emit('release');
        }
    }
}
</script>
<style scoped>
.cell {
    /* padding: 1rem; */
    cursor: pointer;
    border-right: 2px dashed var(--grid-separations);
    border-bottom: 2px dashed var(--grid-separations);
    aspect-ratio: 1;

}
    @supports not (aspect-ratio: auto) { 
        .cell {

            padding-top: 100%;
        height: 0;
        position: relative;
        overflow: hidden;
        }
        

    }
.col5 {
    border-right: 2px dashed var(--grid-dark);
}
.row5 {
    border-bottom: 2px dashed var(--grid-dark);
}
.col5, .row5 {
    z-index: 1;
}
.col5.row5 {
    z-index: 2;

}

</style>