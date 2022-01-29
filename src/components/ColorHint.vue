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
    font-weight: bold;
    background-color: #333;
    border-radius: 50%;
    width: 1.2rem;
    height: 1.2rem;
    display: inline-block;
    text-align: center;
}
span {
    font-size: 1.2rem;
}
.hidden {
    visibility: hidden;
}
</style>