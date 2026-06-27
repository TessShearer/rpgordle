<template>
  <nav class="navbar navbar-expand-lg app-navbar">
    <div class="container">
      <RouterLink class="navbar-brand fw-bold" to="/">RPGordle</RouterLink>
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navMenu"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navMenu">
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Daily</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/freeplay">Free Play</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/game-info">Game Info</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/word-info">Word Info</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <RouterView :key="$route.name" />
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>
