import { createRouter, createWebHistory } from 'vue-router';
import Board from './pages/Board.vue';
import SignalDetail from './pages/SignalDetail.vue';
import ManageSignals from './pages/ManageSignals.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'board', component: Board },
    { path: '/signals/:id', name: 'signal-detail', component: SignalDetail, props: true },
    { path: '/manage', name: 'manage', component: ManageSignals },
  ],
});
