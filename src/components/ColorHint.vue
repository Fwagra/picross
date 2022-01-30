<template>
    <span :style="style" :class="{ contiguous: isContiguous, hidden: hint.number === 0 && hint.correct || hint.number > 0 && hint.correct }">{{ hint.number }}</span>
</template>
<script>
export default {
    props: ['hint', 'color'],
    inject: ['colors'],
    data() {
        return {
            }
    },
    computed: {
        style() {
            return {
                color: this.colors[this.color]
            }
        },
        isContiguous() {
            return this.hint.contiguous && this.hint.number > 1;
        }
    }
}
</script>
<style scoped>
.contiguous {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    text-shadow: 1px 1px 0px rgba(0, 0, 0, 0.4);
}
span {
    --font-size: 1.1rem;
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

@media screen and (min-width: 600px) {
    span {
        --font-size: 1.8rem
    }
}
</style>