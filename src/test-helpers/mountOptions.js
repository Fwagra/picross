// Helpers de test partagés pour les composants Vue.
// Enregistre les mêmes plugins globaux que main.js (Tippy + événements tactiles)
// afin que les directives v-tippy / v-touch se résolvent lors du montage.
import VueTippy from 'vue-tippy';
import Vue3TouchEvents from 'vue3-touch-events';

// Options `global` à étaler dans mount()/shallowMount().
export const globalPlugins = {
  plugins: [VueTippy, Vue3TouchEvents],
};

// Fusionne les plugins globaux avec des injections (provide) et autres options.
export function withGlobal(extra = {}) {
  const { provide, stubs, ...rest } = extra;
  return {
    global: {
      plugins: [VueTippy, Vue3TouchEvents],
      ...(provide ? { provide } : {}),
      ...(stubs ? { stubs } : {}),
      ...rest,
    },
  };
}
