<template>
    <transition name="fade" appear>
        <div class="modal-back" @click.self="close">
            <div class="modal-wrapper">
                <div class="modal-header">
                    <h3>{{title}}</h3>
                    <button class="close" @click="close">&times;</button>
                </div>
                <div class="modal-body">
                    <input ref="input" v-if="type == 'link'"  type="text" :value="shareLink" class="code">
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    props: ['title', 'type', 'shareLink'],
    methods: {
        close() {
            this.$emit('close');
        }
    },
    mounted() {
        if(this.type == 'link') {
            this.$refs.input.select();
        }
    }
}
</script>

<style scoped>
.modal-back {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    z-index: 10;
}   
.modal-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    background-color: #fff;
    border-radius: 5px;
    padding: 1rem;
}
.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.modal-header h3 {
    margin: 0;
}
.modal-header button {
    border: none;
    background: none;
    cursor: pointer;
}
.modal-body {
    padding: 1rem;
}
.close {
    font-size: 2rem;
}


.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.code {
    padding: 1rem;
    width: 100%;
}
</style>