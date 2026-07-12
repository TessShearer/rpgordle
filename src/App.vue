<template>
  <nav class="navbar navbar-expand app-navbar">
    <div class="container">
        <ul class="navbar-nav flex-row ms-auto">
          <li class="nav-item">
            <RouterLink class="nav-link" to="/">Daily</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/freeplay">Custom Play</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/testing">Testing</RouterLink>
          </li>
          <li class="nav-item">
            <RouterLink class="nav-link" to="/game-info">Game Info</RouterLink>
          </li>
        </ul>
    </div>
  </nav>

  <RouterView :key="$route.name" />
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>
