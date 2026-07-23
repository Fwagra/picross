<template>
  <header>
    <div class="title-wrap" :class="{ 'has-daily': dailyMode }">
      <h1>Color Picross</h1>
      <span v-if="dailyMode" class="daily-badge">Daily</span>
    </div>
    <p v-if="dailyMode && dailyDateLabel" class="daily-date">{{ dailyDateLabel }}</p>
  </header>
  <main>
    <Game @daily-state="onDailyState"></Game>
  </main>
</template>

<script>
import Game from './components/Game.vue';
import './assets/style.css';

export default {
  name: 'App',
  components: {
    Game
  },
  data() {
    return {
      dailyMode: false,
      dailyDateKey: null,
    };
  },
  computed: {
    dailyDateLabel() {
      if (!this.dailyDateKey) return '';
      const [year, month, day] = this.dailyDateKey.split('-');
      return `${day}/${month}/${year}`;
    },
  },
  methods: {
    onDailyState({ dailyMode, dailyDateKey }) {
      this.dailyMode = dailyMode;
      this.dailyDateKey = dailyDateKey;
    },
  },
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

.daily-date {
  margin: 0 0 1.5rem;
  font-size: 1.8rem;
  line-height: 1;
  color: var(--grid-dark);
}
</style>
