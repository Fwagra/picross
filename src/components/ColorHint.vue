<template>
    <span :style="style" :class="{ contiguous: isContiguous, hidden: hint.number === 0 }">{{ hint.number }}</span>
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
}
.hidden {
    visibility: hidden;
}
</style>