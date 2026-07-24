<template>
    <span :style="style" :class="{ contiguous: isContiguous, hidden: hint.number === 0 && hint.correct || hint.number > 0 && hint.correct }">{{ hint.number }}</span>
</template>
<script setup>
import { computed, inject } from 'vue';

const props = defineProps(['hint', 'color']);
// `colors` est fourni par Game sous forme de ref réactive.
const colors = inject('colors');

const style = computed(() => ({
    color: colors.value[props.color],
}));

const isContiguous = computed(() => props.hint.contiguous && props.hint.number > 1);
</script>
<style scoped>
.contiguous {
    background-color: var(--hint-pill-bg);
    border-radius: 50%;
    text-shadow: 1px 1px 0px var(--hint-pill-shadow);
    transition: background-color .3s;
}
span {
    --font-size: 1.7rem;
    font-size: var(--font-size);
    display: inline-block;
    width: var(--font-size);
    line-height: 1.1;
    height: var(--font-size);
    text-align: center;
}
.hidden {
    visibility: hidden;
}

@media screen and (min-width: 1100px) {
    span {
        --font-size: 1.8rem
    }
}
</style>