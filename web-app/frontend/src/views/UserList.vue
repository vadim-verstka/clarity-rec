<template>
  <div class="user-list-container">
    <h1>Список пользователей</h1>

    <button @click="showModal = true" class="btn-create">
      Создать пользователя
    </button>

    <div v-if="users.length === 0" class="empty-state">
      <p>Пользователи ещё не созданы</p>
    </div>

    <div v-else class="users-grid">
      <div v-for="user in users" :key="user.userId" class="user-card">
        <h3>{{ user.name }}</h3>
        <p>Лайков: {{ user.likeCount }}</p>
        <div class="user-actions">
          <router-link :to="`/user/${user.userId}/feed`" class="btn-feed"
            >Лента</router-link
          >
          <router-link :to="`/user/${user.userId}/profile`" class="btn-profile"
            >Личный кабинет</router-link
          >
        </div>
      </div>
    </div>

    <!-- Modal for creating user -->
    <div v-if="showModal" class="modal-overlay" @click="showModal = false">
      <div class="modal" @click.stop>
        <h2>Создание пользователя</h2>
        <form @submit.prevent="createUser">
          <div class="form-group">
            <label for="userName">Имя</label>
            <input
              type="text"
              id="userName"
              v-model="newUserName"
              required
              placeholder="Введите имя"
            />
          </div>
          <button type="submit" class="btn-submit">Создать</button>
          <button type="button" @click="showModal = false" class="btn-cancel">
            Отмена
          </button>
          <p v-if="createError" class="error">{{ createError }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import axios from "axios";

const users = ref([]);
const showModal = ref(false);
const newUserName = ref("");
const createError = ref("");

const token = localStorage.getItem("adminToken");
const headers = { Authorization: `Bearer ${token}` };

const loadUsers = async () => {
  try {
    const response = await axios.get("/api/users", { headers });
    users.value = response.data;
  } catch (e) {
    console.error("Failed to load users:", e);
  }
};

const createUser = async () => {
  try {
    createError.value = "";
    const response = await axios.post(
      "/api/users",
      { name: newUserName.value },
      { headers },
    );
    users.value.push(response.data);
    newUserName.value = "";
    showModal.value = false;
  } catch (e) {
    if (e.response && e.response.status === 400) {
      createError.value = "Пользователь с таким именем уже существует";
    } else {
      createError.value = "Ошибка при создании пользователя";
    }
  }
};

onMounted(loadUsers);
</script>

<style scoped>
.user-list-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  margin-bottom: 1.5rem;
  color: #35495e;
}

.btn-create {
  padding: 0.75rem 1.5rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.btn-create:hover {
  background-color: #35a070;
}

.empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  color: #666;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.user-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.user-card h3 {
  color: #35495e;
  margin-bottom: 0.5rem;
}

.user-card p {
  color: #666;
  margin-bottom: 1rem;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-feed,
.btn-profile {
  flex: 1;
  padding: 0.5rem;
  text-align: center;
  text-decoration: none;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-feed {
  background-color: #41b883;
  color: white;
}

.btn-profile {
  background-color: #35495e;
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
}

.modal h2 {
  margin-bottom: 1.5rem;
  color: #35495e;
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

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.btn-cancel {
  width: 100%;
  padding: 0.75rem;
  background-color: #ccc;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.error {
  color: #ff4444;
  margin-top: 1rem;
  text-align: center;
}
</style>
