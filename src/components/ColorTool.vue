<template>
    <transition name="fade" appear>
        <div class="color">
            <div class="color" :class="{current: current}" v-tippy="{ content: 'Peindre avec cette couleur' }" @click="updateCurrentColor(colorIndex)" :style="{backgroundColor: color}"></div>
            <label  v-tippy="{ content: 'Éditer la couleur' }" class="edit-btn" v-if="editMode" :for="'color' + colorIndex" >
                <i class="gg-pen"></i>
                <input style="display:none" type="color" @change="changedColor"  :data-color="colorIndex" name="color" :id="'color' + colorIndex">
            </label>
        </div>
    </transition>
</template>

<script>
export default {
    inject: ['updateColors', 'updateCurrentColor'],
    props: ['color', 'colorIndex', 'editMode', 'current'],
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
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    cursor: pointer;
    transition: box-shadow 0.2s ease-in-out;
}

.edit-btn {
    display: flex;
    transition: transform .3s ease-in-out;
    justify-content: center;
    cursor: pointer;
    opacity: 0.5;
    width: 100%;
    min-height: 1rem;
}
.edit-btn [class*="gg-"] {
    --ggs: .8;
}

.current {
    box-shadow: inset 0 0 0 2px var(--grid-dark);
    transition: box-shadow 0.2s ease;

}

.fade-enter-active,
.fade-leave-active {
  transition: transform .4s ease;
}

.fade-enter-from,
.fade-leave-from,
.fade-leave-to {
  transform: translateY(1rem);
}

</style>