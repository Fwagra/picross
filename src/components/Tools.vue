<template>
    <div class="current-color" :style="{backgroundColor: getCurrentColor}"></div>
    <div class="eraser"  @click="updateCurrentColor('')">Gomme</div>
    <color-tool v-for="(color, colorIndex) in colors" :key="colorIndex" :color="color" :colorIndex="colorIndex"></color-tool>
    <template v-if="editMode">
        <div  class="add-color" @click="$emit('addColor')" v-if="colors.length < 5">Ajouter</div>
        <div  class="delete-color" @click="$emit('removeColor')" v-if="colors.length > 2">Supprimer</div>
        <label for="lines">Lignes : </label>
        <input type="number" min="3" max="15" :value="gridRows" @change="$emit('updateRows', $event.target.value)">
        
    </template>
</template>
<script>

import ColorTool from './ColorTool.vue';

export default {
    components: {
        ColorTool
    },
    emits: ['addColor', 'removeColor', 'updateRows'],
    inject: ['editMode', 'updateCurrentColor'],
    props: ['colors', 'currentColor', 'gridRows', 'gridColumns'],
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