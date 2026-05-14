<template>
  <div id="app">
    <nav v-if="isLoggedIn && !isLoginPage" class="navbar">
      <span class="brand">Система Рекомендаций</span>
      <button @click="logout" class="btn-logout">Выйти</button>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const isLoggedIn = computed(() => !!localStorage.getItem("adminToken"));
const isLoginPage = computed(() => route.name === "Login");

const logout = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("currentUserId");
  window.location.reload();
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    sans-serif;
  background-color: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #35495e;
  color: white;
}

.brand {
  font-size: 1.25rem;
  font-weight: bold;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-logout:hover {
  background-color: #35a070;
}
</style>
