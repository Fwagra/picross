<template>
    <div class="cell" @mousedown="this.updateCell" :style="style"></div>
</template>

<script>
export default {
    props: ['color', 'rowIndex', 'columnIndex'],
    computed: {
        style() {
            return {
                backgroundColor: this.color
            }
        }
    },
    methods: {
        updateCell() {
            this.$emit('update-cell', this.rowIndex, this.columnIndex);
        }
    }
}
</script>
<style scoped>
.cell {
    padding: 1rem;
}
.cell::before {

    content: "";
    padding-bottom: 100%;
    display: block;
}
</style>