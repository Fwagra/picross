<template>
  <header>
    <h1>Color Picross</h1>
  </header>
  <main>
    <Game></Game>
  </main>
</template>

<script>
import Game from './components/Game.vue';
import './assets/style.css';

export default {
  name: 'App',
  components: {
    Game
  }
}
</script>

<style scoped>
header {
  text-align: center;
}
h1 {
  font-size: 3rem;
  margin: 0 0 2rem;
}
</style>