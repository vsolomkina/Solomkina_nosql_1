// queries/part4_indexes.js
// Запуск: mongosh "mongodb+srv://valeriia_goit:dsKwC9cbk0F8GhX1@cluster0.fkmtr2j.mongodb.net/?appName=Cluster0" --file queries/part4_indexes.js"

const db = db.getSiblingDB("spotify");

// ─────────────────────────────────────────────
// Завдання 1. Аналіз запиту та індексація
// ─────────────────────────────────────────────
print("\n=== Завдання 1. План виконання БЕЗ індексу ===");

const explainBefore = db["tracks"].find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("winningPlan stage:", explainBefore.queryPlanner.winningPlan.stage);
print("totalDocsExamined:", explainBefore.executionStats.totalDocsExamined);
print("totalKeysExamined:", explainBefore.executionStats.totalKeysExamined);
print("executionTimeMillis:", explainBefore.executionStats.executionTimeMillis);

// Створюємо індекс
print("\n--- Створення індексу ---");
db["tracks"].createIndex(
  {
    track_genre: 1,
    "audio_features.danceability": 1,
    popularity: -1
  },
  { name: "idx_genre_danceability_popularity" }
);
print("Індекс створено.");

print("\n=== Завдання 1. План виконання ПІСЛЯ індексу ===");

const explainAfter = db["tracks"].find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats");

print("winningPlan stage:", explainAfter.queryPlanner.winningPlan.stage);
print("inputStage:",        explainAfter.queryPlanner.winningPlan.inputStage?.stage);
print("indexName:",         explainAfter.queryPlanner.winningPlan.inputStage?.indexName);
print("totalDocsExamined:", explainAfter.executionStats.totalDocsExamined);
print("totalKeysExamined:", explainAfter.executionStats.totalKeysExamined);
print("executionTimeMillis:", explainAfter.executionStats.executionTimeMillis);


// ─────────────────────────────────────────────
// Завдання 2. Індекс для пошуку музики для роботи
// ─────────────────────────────────────────────
print("\n=== Завдання 2. Індекс для полів instrumentalness, speechiness, explicit ===");

db["tracks"].createIndex(
  {
    "audio_features.instrumentalness": 1,
    "audio_features.speechiness": 1,
    explicit: 1
  },
  { name: "idx_work_music" }
);
print("Індекс idx_work_music створено.");

const explainWork = db["tracks"].find({
  "audio_features.instrumentalness": { $gt: 0.5 },
  "audio_features.speechiness":      { $lt: 0.1 },
  explicit: false
}).explain("executionStats");

print("winningPlan stage:", explainWork.queryPlanner.winningPlan.stage);
print("inputStage:",        explainWork.queryPlanner.winningPlan.inputStage?.stage);
print("indexName:",         explainWork.queryPlanner.winningPlan.inputStage?.indexName);
print("totalDocsExamined:", explainWork.executionStats.totalDocsExamined);
print("totalKeysExamined:", explainWork.executionStats.totalKeysExamined);
print("executionTimeMillis:", explainWork.executionStats.executionTimeMillis);


// ─────────────────────────────────────────────
// Завдання 3. Перевірка покривного запиту
// ─────────────────────────────────────────────
print("\n=== Завдання 3. Перевірка покривного запиту ===");

const explainCovered = db["tracks"].find({
  track_genre: "pop",
  popularity: { $gte: 70 }
}).explain("executionStats");

print("winningPlan stage:", explainCovered.queryPlanner.winningPlan.stage);
print("inputStage:",        explainCovered.queryPlanner.winningPlan.inputStage?.stage);
print("indexName:",         explainCovered.queryPlanner.winningPlan.inputStage?.indexName);
print("totalDocsExamined:", explainCovered.executionStats.totalDocsExamined);
print("totalKeysExamined:", explainCovered.executionStats.totalKeysExamined);
