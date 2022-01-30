<template>
    <div  :class="cellClasses" class="cell grid-cell" v-touch:press="this.updateCell"  :style="style"></div>
</template>

<script>
export default {
    inject: ['colors'],
    props: ['color', 'rowIndex', 'columnIndex', 'totalRows', 'totalColumns'],
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
        updateCell() {
            this.$emit('update-cell', this.rowIndex, this.columnIndex);
        },
    }
}
</script>
<style scoped>
.cell {
    padding: 1rem;
    cursor: pointer;
    border: 2px dashed var(--grid-separations);
    min-width: 2.5rem;
    min-height: 2.5rem;
    margin: 0 -2px -2px 0;
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
.cell::before {
    content: "";
    padding-bottom: 100%;
    display: block;
}
</style>