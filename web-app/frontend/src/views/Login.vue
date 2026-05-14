<template>
  <div class="login-container">
    <h1>Авторизация</h1>
    <form @submit.prevent="login" class="login-form">
      <div class="form-group">
        <label for="login">Логин</label>
        <input
          type="text"
          id="login"
          v-model="loginForm.login"
          required
          placeholder="Введите логин"
        />
      </div>
      <div class="form-group">
        <label for="password">Пароль</label>
        <input
          type="password"
          id="password"
          v-model="loginForm.password"
          required
          placeholder="Введите пароль"
        />
      </div>
      <button type="submit" class="btn-submit">Войти</button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const router = useRouter();
const loginForm = ref({ login: "", password: "" });
const error = ref("");

const login = async () => {
  try {
    const response = await axios.post("/api/login", loginForm.value);
    localStorage.setItem("adminToken", response.data.token);
    router.push("/users");
  } catch (e) {
    error.value = "Неверный логин или пароль";
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}

h1 {
  margin-bottom: 2rem;
  color: #35495e;
}

.login-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #35495e;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

input:focus {
  outline: none;
  border-color: #41b883;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
}

.btn-submit:hover {
  background-color: #35a070;
}

.error {
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
}
</style>
