<template>
  <main class="container py-5">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <h1 class="mb-4">About</h1>
        <p class="text-muted">
          RPGordle is a word-guessing game. More details coming soon.
        </p>
        <RouterLink to="/" class="btn btn-press mt-4">Back to Home</RouterLink>
      </div>
    </div>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
