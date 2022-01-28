<template>
    <div class="color">
        <div class="color" @click="updateCurrentColor(colorIndex)" :style="{backgroundColor: color}"></div>
        <label v-if="editMode" :for="'color' + colorIndex" >
            edit
            <input style="display:none" type="color" @change="changedColor"  :data-color="colorIndex" name="color" :id="'color' + colorIndex">
        </label>
    </div>
</template>

<script>
export default {
    inject: ['updateColors', 'updateCurrentColor', 'editMode'],
    props: ['color', 'colorIndex'],
    methods: {
        changedColor (event) {
            this.updateColors(event.target.dataset.color, event.target.value);
        }
    },
}
</script>

<style scoped>
.color {
    display: inline-block;
    width: 2rem;
    height: 2rem;
    border-radius: 50%;
    margin: 0.5rem;
    cursor: pointer;
}
</style>