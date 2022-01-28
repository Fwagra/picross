<template>
    <div class="current-color" :style="{backgroundColor: getCurrentColor}"></div>
    <div class="eraser"  @click="updateCurrentColor('')">Gomme</div>
    <color-tool v-for="(color, colorIndex) in colors" :key="colorIndex" :color="color" :colorIndex="colorIndex"></color-tool>
    <div class="add-color" @click="$emit('addColor')" v-if="editMode">Ajouter</div>
</template>
<script>

import ColorTool from './ColorTool.vue';

export default {
    components: {
        ColorTool
    },
    emits: ['addColor'],
    inject: ['editMode', 'updateCurrentColor'],
    props: ['colors', 'currentColor'],
    computed: {
        getCurrentColor() {
            return this.currentColor === '' ? '#FFF' : this.colors[this.currentColor];
        }
    }
}
</script>


<style scoped>

.current-color {
    width: 4rem;
    display: inline-block;
    height: 4rem;
    border-radius: 3px;
    margin: 0.5rem;
}
</style>