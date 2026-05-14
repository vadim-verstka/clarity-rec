const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8081;

app.use(cors());
app.use(express.json());

// In-memory storage for user recommendations
// Structure: { userId: { category: { entityValue: { rawWeightSum, triggerEvents: [] } } } }
const usersRecStorage = new Map();

// Algorithm constants
const DECAY_RATE = 0.1; // Weight halves approximately every 7 days

// POST /api/events - Receive event and store it
app.post("/api/events", (req, res) => {
  const { userId, entityType, entityValue, triggerType, weight, timestamp } =
    req.body;

  if (!userId || !entityType || !entityValue) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Initialize user storage if not exists
  if (!usersRecStorage.has(userId)) {
    usersRecStorage.set(userId, {});
  }

  const userStorage = usersRecStorage.get(userId);

  // Initialize entity type storage if not exists
  if (!userStorage[entityType]) {
    userStorage[entityType] = {};
  }

  // Initialize entity value storage if not exists
  if (!userStorage[entityType][entityValue]) {
    userStorage[entityType][entityValue] = {
      rawWeightSum: 0,
      triggerEvents: [],
    };
  }

  const entityStorage = userStorage[entityType][entityValue];

  // Handle UNLIKE event - remove the most recent matching LIKE
  if (triggerType === "UNLIKE") {
    // Find the most recent LIKE event for this category
    const likeIndex = entityStorage.triggerEvents.findIndex(
      (e) => e.triggerType === "LIKE"
    );
    if (likeIndex !== -1) {
      // Remove the LIKE event
      entityStorage.triggerEvents.splice(likeIndex, 1);
      entityStorage.rawWeightSum = Math.max(0, entityStorage.rawWeightSum - weight);
      
      // If no more events, clean up the entity
      if (entityStorage.triggerEvents.length === 0) {
        delete userStorage[entityType][entityValue];
        
        // If no more entities in this type, clean up the type
        if (Object.keys(userStorage[entityType]).length === 0) {
          delete userStorage[entityType];
        }
        
        // If no more types for this user, clean up the user
        if (Object.keys(userStorage).length === 0) {
          usersRecStorage.delete(userId);
        }
      }
    }
    res.json({ status: "success", action: "unliked" });
    return;
  }

  // Add LIKE event to storage
  entityStorage.rawWeightSum += weight;
  entityStorage.triggerEvents.push({
    triggerType,
    weight,
    timestamp,
  });

  res.json({ status: "success", action: "liked" });
});

// GET /api/recommendations/:userId - Generate recommendations using algorithm
app.get("/api/recommendations/:userId", (req, res) => {
  const { userId } = req.params;

  if (!usersRecStorage.has(userId)) {
    return res.json([]);
  }

  const userStorage = usersRecStorage.get(userId);
  const recommendationsArray = [];
  const currentTime = Date.now();

  // Iterate over all entity types (e.g., 'category')
  for (const entityType in userStorage) {
    const entities = userStorage[entityType];

    // Iterate over all entity values (e.g., 'IT', 'Философия')
    for (const entityValue in entities) {
      const entityData = entities[entityValue];
      let categoryDecayedSum = 0;

      // Calculate decayed weight for each event
      for (const event of entityData.triggerEvents) {
        const daysPassed =
          (currentTime - event.timestamp) / (1000 * 60 * 60 * 24);
        const eventDecayedWeight =
          event.weight * Math.exp(-DECAY_RATE * daysPassed);
        categoryDecayedSum += eventDecayedWeight;
      }

      // Apply logarithmic saturation
      const totalWeight =
        Math.round(Math.log(categoryDecayedSum + 1) * 100) / 100;

      // Create recommendation object
      recommendationsArray.push({
        entityType,
        entityValue,
        totalWeight,
        triggeringEvents: entityData.triggerEvents,
      });
    }
  }

  // Sort by totalWeight descending
  recommendationsArray.sort((a, b) => b.totalWeight - a.totalWeight);

  res.json(recommendationsArray);
});

app.listen(PORT, () => {
  console.log(`Recommendation service running on port ${PORT}`);
});
