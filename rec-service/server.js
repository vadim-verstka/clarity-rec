const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8081;

app.use(cors());
app.use(express.json());


const usersRecStorage = new Map();

const DECAY_RATE = 0.1; 

app.post("/api/events", (req, res) => {
  const { userId, entityType, entityValue, triggerType, weight, timestamp } =
    req.body;

  if (!userId || !entityType || !entityValue) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  if (!usersRecStorage.has(userId)) {
    usersRecStorage.set(userId, {});
  }

  const userStorage = usersRecStorage.get(userId);

  if (!userStorage[entityType]) {
    userStorage[entityType] = {};
  }

  if (!userStorage[entityType][entityValue]) {
    userStorage[entityType][entityValue] = {
      rawWeightSum: 0,
      triggerEvents: [],
    };
  }

  const entityStorage = userStorage[entityType][entityValue];
  entityStorage.rawWeightSum += weight;
  entityStorage.triggerEvents.push({
    triggerType,
    weight,
    timestamp,
  });

  res.json({ status: "success" });
});

app.get("/api/recommendations/:userId", (req, res) => {
  const { userId } = req.params;

  if (!usersRecStorage.has(userId)) {
    return res.json([]);
  }

  const userStorage = usersRecStorage.get(userId);
  const recommendationsArray = [];
  const currentTime = Date.now();

  for (const entityType in userStorage) {
    const entities = userStorage[entityType];

    for (const entityValue in entities) {
      const entityData = entities[entityValue];
      let categoryDecayedSum = 0;

      for (const event of entityData.triggerEvents) {
        const daysPassed =
          (currentTime - event.timestamp) / (1000 * 60 * 60 * 24);
        const eventDecayedWeight =
          event.weight * Math.exp(-DECAY_RATE * daysPassed);
        categoryDecayedSum += eventDecayedWeight;
      }

      const totalWeight =
        Math.round(Math.log(categoryDecayedSum + 1) * 100) / 100;

      recommendationsArray.push({
        entityType,
        entityValue,
        totalWeight,
        triggeringEvents: entityData.triggerEvents,
      });
    }
  }

  recommendationsArray.sort((a, b) => b.totalWeight - a.totalWeight);

  res.json(recommendationsArray);
});

app.listen(PORT, () => {
  console.log(`Recommendation service running on port ${PORT}`);
});
