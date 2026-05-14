const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 8082;

app.use(cors());
app.use(express.json());

// POST /api/explain - Generate explanations from recommendations
app.post("/api/explain", (req, res) => {
  const recommendations = req.body;

  if (!Array.isArray(recommendations)) {
    return res.status(400).json({ error: "Expected array of recommendations" });
  }

  // Step A: Generate text explanations
  const explanations = recommendations.map((rec) => {
    const likeCount = rec.triggeringEvents ? rec.triggeringEvents.length : 0;
    let text = "";

    if (likeCount === 1) {
      text = `Категория «${rec.entityValue}» рекомендована с высоким приоритетом (сила рекомендации: ${rec.totalWeight}), так как вы поставили ${likeCount} лайк.`;
    } else if (likeCount >= 2 && likeCount <= 4) {
      text = `Категория «${rec.entityValue}» рекомендована (сила рекомендации: ${rec.totalWeight}), так как вы поставили ${likeCount} лайка.`;
    } else {
      text = `Категория «${rec.entityValue}» рекомендована (сила рекомендации: ${rec.totalWeight}), так как вы поставили ${likeCount} лайков.`;
    }

    return {
      entityValue: rec.entityValue,
      text,
    };
  });

  // Step B: Adaptive chart config generation
  let chartConfig;
  if (recommendations.length === 0) {
    chartConfig = null;
  } else if (recommendations.length === 1) {
    // Pie chart for single recommendation
    chartConfig = {
      type: "pie",
      data: {
        labels: [recommendations[0].entityValue],
        datasets: [
          {
            label: "Сила рекомендации (Weight)",
            data: [recommendations[0].totalWeight],
            backgroundColor: ["#41B883"],
          },
        ],
      },
      options: {},
    };
  } else {
    // Bar chart for multiple recommendations
    const colors = [
      "#41B883",
      "#35495E",
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
    ];

    chartConfig = {
      type: "bar",
      data: {
        labels: recommendations.map((r) => r.entityValue),
        datasets: [
          {
            label: "Сила рекомендации (Weight)",
            data: recommendations.map((r) => r.totalWeight),
            backgroundColor: recommendations.map(
              (_, i) => colors[i % colors.length],
            ),
          },
        ],
      },
      options: {
        scales: {
          y: { beginAtZero: true },
        },
      },
    };
  }

  // Step C: Form final response object
  const response = {
    summaryText: "Основываясь на ваших действиях, мы подобрали эти категории.",
    explanations,
    chartConfig,
  };

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Explanation service running on port ${PORT}`);
});
