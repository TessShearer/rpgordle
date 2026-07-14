import { defineStore } from 'pinia'
import { ref } from 'vue'

// Lets GameView (rendered inside RouterView) expose a restart action to the
// navbar in App.vue, which lives outside the routed component tree.
export const useGameNavStore = defineStore('gameNav', () => {
  const active = ref(false)
  const restart = ref(null)
  return { active, restart }
})
