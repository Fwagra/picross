<template>
    <div class="toolbar">
        <div class="current-color" :style="{backgroundColor: getCurrentColor}"></div>
        <div class="eraser tool-btn"  @click="updateCurrentColor('')">Gomme</div>
        <color-tool v-for="(color, colorIndex) in colors" :key="colorIndex" :color="color" :colorIndex="colorIndex" :editMode="editMode"></color-tool>
        <template v-if="editMode">
            <div  class="add-color tool-btn" @click="$emit('addColor')" v-if="colors.length < 5">Ajouter</div>
            <div  class="delete-color tool-btn" @click="$emit('removeColor')" v-if="colors.length > 2">Supprimer</div>
            <label for="lines">Lignes : </label>
            <input type="number" id="lines" min="3" max="15" :value="gridRows" @change="$emit('updateRows', $event.target.value)">
            <label for="cols">Colonnes : </label>
            <input type="number" id="cols" min="3" max="15" :value="gridColumns" @change="$emit('updateCols', $event.target.value)">
            <div class="fill-color tool-btn" @click="$emit('fillColor')">Remplir</div>
            <div  @[isFilled&&`click`]="openShareModal" class="share">Partager mon Picross</div>
            <Modal title="Copie le lien ci-dessous et défie tes amis !"  @close="share = !share" :shareLink="shareLink" :type="'link'" v-if="share">
            </Modal>
        </template>
    </div>
</template>
<script>

import ColorTool from './ColorTool.vue';
import Modal from './Modal.vue';

export default {
    components: {
        ColorTool,
        Modal
    },
    emits: ['addColor', 'removeColor', 'updateRows', 'updateCols', 'fillColor', 'updateShareLink'],
    inject: [ 'updateCurrentColor'],
    props: ['colors', 'currentColor', 'gridRows', 'gridColumns', "isFilled", "shareLink", "editMode"],
    computed: {
        getCurrentColor() {
            return this.currentColor === '' ? '#FFF' : this.colors[this.currentColor];
        },
    },
    data() {
        return {
            share: false,
        }
    },
    methods: {
        openShareModal() {
            this.$emit('updateShareLink');
            this.share = true;
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
.tool-btn {
    border-radius: 3px;
    margin: 0.5rem;
    cursor: pointer;
    background-color: brown;
    padding: 1rem;
    color: #FFF;
}
</style>