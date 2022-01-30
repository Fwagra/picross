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
    background-color: rgb(207, 206, 206);
    border-radius: 50%;
}
span {
    font-size: 1.4rem;
    display: inline-block;
    width: 1.4rem;
    line-height: 1.5rem;
    height: 1.4rem;
    text-align: center;
    text-shadow: 1px 1px 0px var(--grid-dark);
}
.hidden {
    visibility: hidden;
}
</style>