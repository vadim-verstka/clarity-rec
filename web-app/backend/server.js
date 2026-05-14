const express = require("express");
const cors = require("cors");
const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 8080;

const REC_SERVICE_URL = "http://localhost:8081";
const EXPLAIN_SERVICE_URL = "http://localhost:8082";
const JWT_SECRET = "diploma-secret-key-2024";

// In-memory storage
const users = new Map(); // userId -> { name, likes: [], likeCount }
const cards = []; // Array of 30 cards
const adminToken = "admin-jwt-token-12345";

app.use(cors());
app.use(express.json());

// Generate 30 random cards
const categories = [
  "Программирование",
  "Философия",
  "Наука",
  "Искусство",
  "Спорт",
  "Музыка",
  "Кино",
  "Литература",
];
const titles = [
  "Введение в алгоритмы",
  "Основы философии",
  "Квантовая физика",
  "Современное искусство",
  "Йога для начинающих",
  "Теория музыки",
  "История кино",
  "Классическая литература",
  "Веб-разработка",
  "Этика и мораль",
  "Биология человека",
  "Живопись эпохи Возрождения",
  "Футбольная тактика",
  "Джазовые импровизации",
  "Научная фантастика",
  "Поэзия серебряного века",
  "Машинное обучение",
  "Экзистенциализм",
  "Химия элементов",
  "Абстракционизм",
  "Баскетбол правила",
  "Рок-музыка история",
  "Документальное кино",
  "Детективные романы",
  "Базы данных основы",
  "Стоицизм практика",
  "Генетика введение",
  "Сюрреализм анализ",
  "Теннис техника",
  "Классическая симфония",
  "Аниме культура",
  "Фэнтези миры",
];
const descriptions = [
  "Подробное изучение основных концепций",
  "Погружение в мир знаний",
  "Увлекательное путешествие",
  "Откройте для себя новое",
  "Практическое руководство",
  "История и современность",
  "Теория и практика",
  "Классика жанра",
  "Современный подход",
  "Новаторские идеи",
];

function generateCards() {
  for (let i = 0; i < 30; i++) {
    cards.push({
      id: `card_${i}`,
      title: titles[i],
      description: descriptions[i % descriptions.length],
      category: categories[i % categories.length],
      image: `https://picsum.photos/seed/${i}/300/200`,
    });
  }
}

generateCards();

// Middleware to verify admin token
function verifyAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Login endpoint
app.post("/api/login", (req, res) => {
  const { login, password } = req.body;
  if (login === "admin" && password === "cradmin123") {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "24h" });
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Get all users
app.get("/api/users", verifyAdmin, (req, res) => {
  const userList = Array.from(users.entries()).map(([userId, data]) => ({
    userId,
    name: data.name,
    likeCount: data.likeCount || 0,
  }));
  res.json(userList);
});

// Create user
app.post("/api/users", verifyAdmin, (req, res) => {
  const { name } = req.body;

  // Check if user with same name exists
  for (const [userId, userData] of users.entries()) {
    if (userData.name === name) {
      return res
        .status(400)
        .json({ error: "User with this name already exists" });
    }
  }

  const userId = crypto.randomUUID();
  users.set(userId, { name, likes: [], likeCount: 0 });
  res.json({ userId, name });
});

// Get feed for user
app.get("/api/feed/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    if (user.likeCount < 5) {
      // Return random cards
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      res.json({ cards: shuffled.slice(0, 10), type: "random" });
    } else {
      // Get recommendations from rec-service
      let recommendations = [];
      try {
        const recResponse = await axios.get(
          `${REC_SERVICE_URL}/api/recommendations/${userId}`,
        );
        recommendations = recResponse.data || [];
      } catch (e) {
        console.error("Recommendation service error:", e.message);
        // Fallback to random cards
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        return res.json({
          cards: shuffled.slice(0, 10),
          type: "random",
          error: "Recommendations unavailable",
        });
      }

      if (recommendations.length === 0) {
        const shuffled = [...cards].sort(() => Math.random() - 0.5);
        res.json({ cards: shuffled.slice(0, 10), type: "random" });
      } else {
        // Sort cards by recommendation weight
        const categoryWeights = {};
        recommendations.forEach((rec) => {
          categoryWeights[rec.entityValue] = rec.totalWeight;
        });

        const recommendedCards = cards.filter(
          (card) => categoryWeights[card.category],
        );
        recommendedCards.sort((a, b) => {
          return (
            (categoryWeights[b.category] || 0) -
            (categoryWeights[a.category] || 0)
          );
        });

        // Add remaining random cards if needed
        const remainingCards = cards.filter(
          (card) => !categoryWeights[card.category],
        );
        const shuffledRemaining = remainingCards.sort(
          () => Math.random() - 0.5,
        );

        const result = [...recommendedCards, ...shuffledRemaining].slice(0, 10);
        res.json({ cards: result, type: "recommended", recommendations });
      }
    }
  } catch (e) {
    console.error("Feed error:", e.message);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    res.json({
      cards: shuffled.slice(0, 10),
      type: "random",
      error: "Failed to load feed",
    });
  }
});

// Handle like/unlike
app.post("/api/like", async (req, res) => {
  const { userId, cardId } = req.body;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const card = cards.find((c) => c.id === cardId);
  if (!card) {
    return res.status(404).json({ error: "Card not found" });
  }

  // Check if user already liked this card
  const existingLikeIndex = user.likes.indexOf(cardId);
  
  if (existingLikeIndex !== -1) {
    // Unlike: remove the like
    user.likes.splice(existingLikeIndex, 1);
    user.likeCount = Math.max(0, user.likeCount - 1);

    // Send unlike event to recommendation service
    const event = {
      userId,
      entityType: "category",
      entityValue: card.category,
      triggerType: "UNLIKE",
      weight: 1.0,
      timestamp: Date.now(),
    };

    try {
      await axios.post(`${REC_SERVICE_URL}/api/events`, event);
    } catch (e) {
      console.error("Failed to send unlike event to rec-service:", e.message);
    }

    res.json({ likeCount: user.likeCount, action: "unliked" });
  } else {
    // Like: add the like
    user.likes.push(cardId);
    user.likeCount = (user.likeCount || 0) + 1;

    // Send like event to recommendation service
    const event = {
      userId,
      entityType: "category",
      entityValue: card.category,
      triggerType: "LIKE",
      weight: 1.0,
      timestamp: Date.now(),
    };

    try {
      await axios.post(`${REC_SERVICE_URL}/api/events`, event);
    } catch (e) {
      console.error("Failed to send event to rec-service:", e.message);
    }

    res.json({ likeCount: user.likeCount, action: "liked" });
  }
});

// Get explanations for user
app.get("/api/explanations/:userId", async (req, res) => {
  const { userId } = req.params;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  try {
    // Get recommendations first
    let recommendations = [];
    try {
      const recResponse = await axios.get(
        `${REC_SERVICE_URL}/api/recommendations/${userId}`,
      );
      recommendations = recResponse.data || [];
    } catch (e) {
      console.error("Recommendation service error:", e.message);
      return res.json({
        summaryText: "Объяснения временно недоступны",
        explanations: [],
        chartConfig: null,
        error: "Recommendations unavailable",
      });
    }

    if (recommendations.length === 0) {
      return res.json({
        summaryText: "Рекомендации ещё не готовы",
        explanations: [],
        chartConfig: null,
        ready: false,
      });
    }

    // Send recommendations to explain service
    try {
      const explainResponse = await axios.post(
        `${EXPLAIN_SERVICE_URL}/api/explain`,
        recommendations,
      );
      res.json({ ...explainResponse.data, ready: true });
    } catch (e) {
      console.error("Explain service error:", e.message);
      res.json({
        summaryText: "Объяснения временно недоступны",
        explanations: recommendations.map((rec) => ({
          entityValue: rec.entityValue,
          text: `Категория "${rec.entityValue}" имеет вес рекомендации ${rec.totalWeight}`,
        })),
        chartConfig: null,
        error: "Explanations unavailable",
      });
    }
  } catch (e) {
    console.error("Explanations error:", e.message);
    res.json({
      summaryText: "Произошла ошибка при загрузке объяснений",
      explanations: [],
      chartConfig: null,
      error: e.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend orchestrator running on port ${PORT}`);
});
