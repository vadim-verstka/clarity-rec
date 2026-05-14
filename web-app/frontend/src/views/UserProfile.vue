<template>
  <div class="profile-container">
    <div class="profile-header">
      <router-link :to="'/users'" class="btn-back"
        >← Назад к списку</router-link
      >
      <h1>Личный кабинет</h1>
    </div>

    <div v-if="loading" class="loading">Загрузка...</div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="loadExplanations" class="btn-retry">
        Попробовать снова
      </button>
    </div>

    <div v-else-if="!ready" class="not-ready-state">
      <h2>Рекомендации ещё не готовы</h2>
      <p>
        Поставьте хотя бы 5 лайков в ленте, чтобы получить персонализированные
        рекомендации.
      </p>
      <router-link :to="`/user/${userId}/feed`" class="btn-feed"
        >Перейти к ленте</router-link
      >
    </div>

    <div v-else class="explanations-content">
      <p class="summary">{{ summaryText }}</p>

      <div class="explanations-list">
        <div
          v-for="exp in explanations"
          :key="exp.entityValue"
          class="explanation-item"
        >
          <h3>{{ exp.entityValue }}</h3>
          <p>{{ exp.text }}</p>
        </div>
      </div>

      <div v-if="chartConfig" class="chart-container">
        <canvas ref="chartCanvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import axios from "axios";
import Chart from "chart.js/auto";

const route = useRoute();
const userId = route.params.userId;

const loading = ref(true);
const error = ref("");
const ready = ref(false);
const summaryText = ref("");
const explanations = ref([]);
const chartConfig = ref(null);
const chartCanvas = ref(null);
let chartInstance = null;

const loadExplanations = async () => {
  loading.value = true;
  error.value = "";

  try {
    const response = await axios.get(`/api/explanations/${userId}`);

    if (
      response.data.ready === false ||
      response.data.error === "Recommendations unavailable"
    ) {
      ready.value = false;
      summaryText.value =
        response.data.summaryText || "Рекомендации ещё не готовы";
    } else {
      ready.value = true;
      summaryText.value = response.data.summaryText || "";
      explanations.value = response.data.explanations || [];
      chartConfig.value = response.data.chartConfig;
    }
  } catch (e) {
    error.value = "Не удалось загрузить объяснения";
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const renderChart = () => {
  if (!chartConfig.value || !chartCanvas.value) return;

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = chartCanvas.value.getContext("2d");
  chartInstance = new Chart(ctx, {
    type: chartConfig.value.type,
    data: chartConfig.value.data,
    options: chartConfig.value.options || {},
  });
};

watch(
  () => chartConfig.value,
  () => {
    if (ready.value && chartConfig.value) {
      setTimeout(renderChart, 100);
    }
  },
  { immediate: false },
);

onMounted(loadExplanations);
</script>

<style scoped>
.profile-container {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
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

.loading,
.error-state,
.not-ready-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
}

.error-state {
  color: #ff4444;
}

.not-ready-state h2 {
  color: #35495e;
  margin-bottom: 1rem;
}

.not-ready-state p {
  color: #666;
  margin-bottom: 1.5rem;
}

.btn-retry,
.btn-feed {
  padding: 0.75rem 1.5rem;
  background-color: #41b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  text-decoration: none;
}

.btn-feed {
  display: inline-block;
}

.explanations-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.summary {
  font-size: 1.1rem;
  color: #35495e;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.explanations-list {
  margin-bottom: 2rem;
}

.explanation-item {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.explanation-item h3 {
  color: #41b883;
  margin-bottom: 0.5rem;
}

.explanation-item p {
  color: #666;
  line-height: 1.5;
}

.chart-container {
  margin-top: 2rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  max-height: 400px;
}
</style>
