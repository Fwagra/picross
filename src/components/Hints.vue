<template>
    <div class="cell">
        <div v-if="error" class="error">!</div>
        <ColorHint v-for="(colorHint, colorIndex) in hint" :hint="colorHint" :color="colorIndex" :key="`color-${colorIndex}`"></ColorHint>
    </div>
</template>

<script>

import ColorHint from './ColorHint.vue';

export default {
    props: ['hint','error'],
    components: {
        ColorHint
    }
}
</script>

<style scoped>
.error {
    color: red;
    display: inline-block;
}
</style>