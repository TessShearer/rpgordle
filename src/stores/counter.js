import { defineStore } from 'pinia'
import { ref } from 'vue'
import { doc, onSnapshot, setDoc, updateDoc, increment as fsIncrement } from 'firebase/firestore'
import { db } from '@/firebase'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const counterDoc = doc(db, 'game', 'counter')

  // Keep local state in sync with Firestore in real time
  onSnapshot(counterDoc, (snap) => {
    if (snap.exists()) {
      count.value = snap.data().count ?? 0
    }
  })

  async function increment() {
    count.value++ // optimistic update so the UI responds instantly
    try {
      await updateDoc(counterDoc, { count: fsIncrement(1) })
    } catch {
      // Document doesn't exist yet — create it
      await setDoc(counterDoc, { count: count.value })
    }
  }

  async function reset() {
    count.value = 0
    await setDoc(counterDoc, { count: 0 })
  }

  return { count, increment, reset }
})
