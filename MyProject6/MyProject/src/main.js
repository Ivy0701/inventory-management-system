
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './styles/theme.scss';
import { useAppStore } from './store/appStore';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

const appStore = useAppStore(pinia);
appStore.hydrateFromStorage();

app.use(router);

app.mount('#app');

