import { createRouter, createWebHistory } from 'vue-router';
import DemoDataPage from './pages/DemoDataPage.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'demo', component: DemoDataPage },
  ],
});
