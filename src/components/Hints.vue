<template>
    <div class="cell">
        <ColorHint v-for="(colorHint, colorIndex) in hint" :hint="colorHint" :color="colorIndex" :key="`color-${colorIndex}`"></ColorHint>
    </div>
</template>

<script>

import ColorHint from './ColorHint.vue';

export default {
    props: ['hint'],
    components: {
        ColorHint
    }
}
</script>