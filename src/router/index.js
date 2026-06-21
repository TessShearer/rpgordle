import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
  },
  {
    path: '/word-info',
    name: 'word-info',
    component: () => import('@/views/HomeView.vue'),
  },
  {
    path: '/game-info',
    name: 'game-info',
    component: () => import('@/views/GameInfoView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
