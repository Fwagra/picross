<template>
    <div class="cell" v-touch:press="this.updateCell"  :style="style"></div>
</template>

<script>
export default {
    inject: ['colors'],
    props: ['color', 'rowIndex', 'columnIndex'],
    computed: {
        style() {
            return {
                backgroundColor: this.colors[this.color]
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
}
.cell::before {

    content: "";
    padding-bottom: 100%;
    display: block;
}
</style>