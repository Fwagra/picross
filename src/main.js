import { createApp } from 'vue'
import App from './App.vue'
import Vue3TouchEvents from 'vue3-touch-events';

const app = createApp(App);
app.config.unwrapInjectedRef = true;
app.use(Vue3TouchEvents);
app.mount('#app');
