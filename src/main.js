import { createApp } from 'vue';
import App from './App.vue';
import Vue3TouchEvents from 'vue3-touch-events';
import VueTippy from 'vue-tippy';
import 'tippy.js/dist/tippy.css';

const app = createApp(App);
app.use(VueTippy);
app.config.unwrapInjectedRef = true;
app.use(Vue3TouchEvents);
app.mount('#app');
