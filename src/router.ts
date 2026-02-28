import { createRouter, createWebHistory } from 'vue-router';
import Dashboard from './pages/Dashboard.vue';
import Editor from './pages/Editor.vue';
import PublicPage from './pages/PublicPage.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: Dashboard },
    { path: '/editor/:id', name: 'editor', component: Editor, props: true },
    { path: '/p/:slug', name: 'public', component: PublicPage, props: true },
  ],
});
