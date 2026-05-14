<template>
  <div class="feed-container">
    <div class="feed-header">
      <router-link :to="'/users'" class="btn-back"
        >← Назад к списку</router-link
      >
      <h1>Лента пользователя</h1>
      <p v-if="likeCount > 0" class="like-count">Лайков: {{ likeCount }}</p>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadFeed" class="btn-retry">Попробовать снова</button>
    </div>

    <div v-else-if="cards.length === 0" class="empty-state">
      <p>Карточки не найдены</p>
    </div>

    <div v-else class="cards-grid">
      <div v-for="card in cards" :key="card.id" class="card">
        <img :src="card.image" :alt="card.title" />
        <div class="card-content">
          <span class="category">{{ card.category }}</span>
          <h3>{{ card.title }}</h3>
          <p>{{ card.description }}</p>
          <button
            @click="handleLike(card)"
            :disabled="likedCards.has(card.id)"
            :class="['btn-like', { liked: likedCards.has(card.id) }]"
          >
            {{ likedCards.has(card.id) ? "❤️ Лайкнуто" : "👍 Лайк" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";

const route = useRoute();
const userId = route.params.userId;

const cards = ref([]);
const loading = ref(true);
const error = ref("");
const likeCount = ref(0);
const likedCards = ref(new Set());
const feedType = ref("random");

const loadFeed = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await axios.get(`/api/feed/${userId}`);
    cards.value = response.data.cards || [];
    feedType.value = response.data.type || "random";

    // Get user info for like count
    const token = localStorage.getItem("adminToken");
    const usersResponse = await axios.get("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const user = usersResponse.data.find((u) => u.userId === userId);
    if (user) {
      likeCount.value = user.likeCount || 0;
    }
  } catch (e) {
    error.value = "Не удалось загрузить ленту";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const handleLike = async (card) => {
  if (likedCards.value.has(card.id)) return;

  try {
    const response = await axios.post("/api/like", {
      userId,
      cardId: card.id,
    });

    likeCount.value = response.data.likeCount;
    likedCards.value.add(card.id);

    // Reload feed if we reached 5 likes
    if (likeCount.value >= 5 && feedType.value !== "recommended") {
      setTimeout(loadFeed, 500);
    }
  } catch (e) {
    console.error("Failed to like:", e);
  }
};

onMounted(loadFeed);
</script>

<style scoped>
.feed-container {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.feed-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.btn-back {
  padding: 0.5rem 1rem;
  background-color: #35495e;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.btn-back:hover {
  background-color: #2a3d4f;
}

h1 {
  color: #35495e;
}

.like-count {
  color: #41b883;
  font-weight: bold;
}

.loading,
.empty-state,
.error-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
}

.error-state {
  color: #ff4444;
}

.btn-retry {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-5px);
}

.card img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.card-content {
  padding: 1rem;
}

.category {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background-color: #e8f5e9;
  color: #41b883;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-bottom: 0.5rem;
}

.card h3 {
  color: #35495e;
  margin-bottom: 0.5rem;
  font-size: 1.1rem;
}

.card p {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.btn-like {
  width: 100%;
  padding: 0.75rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.btn-like:hover:not(:disabled) {
  background-color: #35a070;
}

.btn-like.liked {
  background-color: #ffcdd2;
  color: #c62828;
  cursor: default;
}

.btn-like:disabled {
  cursor: default;
}
</style>
