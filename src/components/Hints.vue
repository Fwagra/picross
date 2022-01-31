<template>
    <div class="cell" ref="cell" :class="{error: error}" v-tippy="errorTip">
        <ColorHint v-for="(colorHint, colorIndex) in hint" :hint="colorHint" :color="colorIndex" :key="`color-${colorIndex}`"></ColorHint>
    </div>
</template>

<script>

import ColorHint from './ColorHint.vue';

export default {
    props: ['hint','error', 'type'],
    components: {
        ColorHint
    },
    computed: {
        errorTip() {
            return this.error ? 'Les couleurs ne correspondent pas aux indices' : '';
        }
    },
    updated() {
        // Update the width of the fake cell in the header each time the left column changes
        this.updateFauxCell();
    },
    mounted() {
        this.updateFauxCell();
    },
    methods: {
        updateFauxCell() {
           this.$emit('updateFauxCell', this.$refs.cell.clientWidth);
        }
    }
}
</script>

<style scoped>
.error {
    background: rgb(235, 160, 160);
}
.row-hints,
.col-hints {
    display: flex;
    justify-content: flex-end;
    align-items: center;
}
.row-hints {
    border-radius: 5px 0  0 5px;
}

.col-hints {
    border-radius: 5px 5px  0 0;
    flex-direction: column;
    
}
</style>