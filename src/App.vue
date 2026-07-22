<template>
  <nav class="navbar navbar-expand app-navbar">
    <div class="container">
        <button v-if="gameNav.active" type="button" class="btn nav-restart-btn" @click="gameNav.restart?.()">
          <span aria-hidden="true">⟲</span> Restart
        </button>
        <ul class="navbar-nav flex-row ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Daily</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/freeplay">Custom Play</RouterLink>
          </li>
          <li class="nav-item">
            <button type="button" class="feedback-bubble-btn" @click="feedbackOpen = true">Feedback</button>
          </li>
          <!-- <li class="nav-item">
            <RouterLink class="nav-link" to="/testing">Testing</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/info">Info</RouterLink>
          </li> -->
        </ul>
    </div>
  </nav>

  <div class="app-background" aria-hidden="true"></div>

  <RouterView :key="$route.name" />

  <Transition name="modal">
    <div v-if="feedbackOpen" class="modal-overlay">
      <div class="modal-card-glow">
        <div class="modal-card">
          <button class="modal-close-btn" type="button" aria-label="Close" @click="closeFeedback">✕</button>
          <label class="feedback-label" for="feedback-text">Send a note to the game makers</label>
          <textarea
            id="feedback-text"
            class="feedback-textarea"
            v-model="feedbackText"
            rows="4"
            :disabled="feedbackSubmitting"
          ></textarea>
          <button
            class="btn btn-press mt-3"
            :disabled="feedbackSubmitting || !feedbackText.trim()"
            @click="submitFeedback"
          >{{ feedbackSubmitting ? 'Sending…' : 'Submit' }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { useGameNavStore } from '@/stores/gameNav.js'
import { db } from '@/firebase.js'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const gameNav = useGameNavStore()

const feedbackOpen = ref(false)
const feedbackText = ref('')
const feedbackSubmitting = ref(false)

function closeFeedback() {
  feedbackOpen.value = false
}

async function submitFeedback() {
  const text = feedbackText.value.trim()
  if (!text) return
  feedbackSubmitting.value = true
  try {
    await addDoc(collection(db, 'notes'), { type: 'game', text, createdAt: serverTimestamp() })
    feedbackText.value = ''
    feedbackOpen.value = false
  } finally {
    feedbackSubmitting.value = false
  }
}
</script>
