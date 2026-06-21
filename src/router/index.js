import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const routes = [
  {
    path: '/',
    name: 'word-info',
    component: HomeView,
  },
  {
    path: '/game-info',
    name: 'game-info',
    component: () => import('@/views/GameInfoView.vue'),
  },
  {
    path: '/game',
    name: 'game',
    component: () => import('@/views/GameView.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
