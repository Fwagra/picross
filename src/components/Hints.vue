<template>
    <div class="cell" :class="{error: error}">
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