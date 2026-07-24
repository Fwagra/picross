<template>
  <header>
    <div class="title-wrap" :class="{ 'has-daily': dailyMode }">
      <h1>Color Picross</h1>
      <span v-if="dailyMode" class="daily-badge">Daily</span>
    </div>
    <div v-if="dailyMode && dailyDateLabel" class="daily-nav">
      <span class="daily-nav-inner">
        <p class="daily-date">{{ dailyDateLabel }}</p>
        <button
          type="button"
          class="daily-arrow daily-arrow-prev"
          :class="{ disabled: !canGoPreviousDaily }"
          :disabled="!canGoPreviousDaily"
          aria-label="Grille précédente"
          title="Grille précédente"
          @click="goToPreviousDaily"
        >
          <i class="gg-arrow-left"></i>
        </button>
        <button
          type="button"
          class="daily-arrow daily-arrow-next"
          :class="{ disabled: !canGoNextDaily }"
          :disabled="!canGoNextDaily"
          aria-label="Grille suivante"
          title="Grille suivante"
          @click="goToNextDaily"
        >
          <i class="gg-arrow-right"></i>
        </button>
      </span>
    </div>
  </header>
  <main>
    <Game ref="game" @daily-state="onDailyState"></Game>
  </main>
</template>

<script setup>
import { ref, computed } from 'vue';
import Game from './components/Game.vue';
import './assets/style.css';

const game = ref(null);

const dailyMode = ref(false);
const dailyDateKey = ref(null);
const canGoPreviousDaily = ref(false);
const canGoNextDaily = ref(false);

const dailyDateLabel = computed(() => {
  if (!dailyDateKey.value) return '';
  const [year, month, day] = dailyDateKey.value.split('-');
  return `${day}/${month}/${year}`;
});

function onDailyState(state) {
  dailyMode.value = state.dailyMode;
  dailyDateKey.value = state.dailyDateKey;
  canGoPreviousDaily.value = state.canGoPreviousDaily;
  canGoNextDaily.value = state.canGoNextDaily;
}

function goToPreviousDaily() {
  game.value?.goToPreviousDaily();
}

function goToNextDaily() {
  game.value?.goToNextDaily();
}
</script>

<style scoped>
header {
  text-align: center;
}
.title-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin: 0 0 2rem;
}
.title-wrap.has-daily {
  margin-bottom: 0.25rem;
}
h1 {
  font-size: 3rem;
  margin: 0;
  line-height: 1;
}
.daily-badge {
  background: var(--grid-dark);
  /* Texte à l'opposé du fond du badge (--grid-dark) : reste lisible sur tous les thèmes. */
  color: var(--background);
  transition: background-color .3s, color .3s;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  line-height: 1.2;
  padding: 0.15rem 0.55rem 0.05rem;
  border-radius: 0.4rem;
  transform: scale(var(--ggs, 1)) translateY(-0.05em);
}

/* Bloc pleine largeur : la date reste sous le titre, centrée comme avant. */
.daily-nav {
  margin: 0 0 1.5rem;
}

/* Wrapper interne dimensionné sur la date : les flèches sont positionnées
   en absolu autour d'elle pour ne pas la décaler de sa position centrée. */
.daily-nav-inner {
  position: relative;
  display: inline-block;
}

.daily-date {
  margin: 0;
  font-size: 1.8rem;
  line-height: 1;
  color: var(--grid-dark);
}

.daily-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 50%;
  color: var(--grid-dark);
  cursor: pointer;
  transition: background-color .2s, opacity .2s;
}
.daily-arrow-prev {
  right: 100%;
}
.daily-arrow-next {
  left: 100%;
}
.daily-arrow:hover {
  background: var(--grid-separations);
}
.daily-arrow.disabled {
  opacity: 0.25;
  cursor: default;
}
.daily-arrow.disabled:hover {
  background: transparent;
}
</style>
