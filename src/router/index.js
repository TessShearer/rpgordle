import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'daily',
    component: () => import('@/views/GameView.vue'),
    props: { mode: 'daily' },
  },
  {
    path: '/freeplay',
    name: 'freeplay',
    component: () => import('@/views/GameView.vue'),
    props: { mode: 'freeplay' },
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
