// queries/part2_queries.js
// Запуск: mongosh "mongodb+srv://valeriia_goit:dsKwC9cbk0F8GhX1@cluster0.fkmtr2j.mongodb.net/?appName=Cluster0" --file queries/part2_queries.js

const db = db.getSiblingDB("spotify");

// ─────────────────────────────────────────────
// Завдання 1. Треки для вечірки
// ─────────────────────────────────────────────
print("\n=== Завдання 1. Треки для вечірки ===");

const partyTracks = db["tracks"].find(
  {
    "audio_features.danceability": { $gt: 0.7 },
    "audio_features.energy":       { $gt: 0.7 },
    "duration_ms":                 { $gte: 180000, $lte: 300000 }
  },
  {
    _id: 0,
    track_name: 1,
    artists: 1,
    duration_ms: 1,
    "audio_features.danceability": 1,
    "audio_features.energy": 1
  }
).toArray();

print("Кількість треків:", partyTracks.length);
printjson(partyTracks.slice(0, 3));


// ─────────────────────────────────────────────
// Завдання 2. Виконавці, у яких усі треки популярні
// ─────────────────────────────────────────────
print("\n=== Завдання 2. Популярні виконавці ===");

const popularArtists = db["tracks"].aggregate([
  { $unwind: "$artists" },
  {
    $group: {
      _id: "$artists",
      track_count: { $sum: 1 },
      min_popularity: { $min: "$popularity" },
      avg_popularity: { $avg: "$popularity" }
    }
  },
  {
    $match: {
      track_count:    { $gte: 3 },
      min_popularity: { $gte: 60 }
    }
  },
  {
    $project: {
      _id: 0,
      artist: "$_id",
      track_count: 1,
      min_popularity: 1,
      avg_popularity: { $round: ["$avg_popularity", 1] }
    }
  },
  { $sort: { avg_popularity: -1 } },
  { $limit: 20 }
]).toArray();

print("Топ-20 популярних виконавців:");
printjson(popularArtists);


// ─────────────────────────────────────────────
// Завдання 3. Нетипові треки
// ─────────────────────────────────────────────
print("\n=== Завдання 3. Нетипові треки ===");

const outlierTracks = db["tracks"].aggregate([
  // Крок 1: розрахувати середнє та стандартне відхилення по жанру
  {
    $group: {
      _id: "$track_genre",
      avg_tempo: { $avg: "$audio_features.tempo" },
      std_tempo: { $stdDevPop: "$audio_features.tempo" },
      tracks: {
        $push: {
          _id: "$_id",
          track_name: "$track_name",
          popularity: "$popularity",
          artists: "$artists",
          audio_features: { tempo: "$audio_features.tempo" }
        }
      }
    }
  },
  // Крок 2: додати поле порогу
  {
    $addFields: {
      outlier_threshold: {
        $add: ["$avg_tempo", { $multiply: [2, "$std_tempo"] }]
      }
    }
  },
  // Крок 3: відфільтрувати треки, що перевищують поріг
  {
    $addFields: {
      outlier_tracks: {
        $filter: {
          input: "$tracks",
          as: "track",
          cond: { $gt: ["$$track.audio_features.tempo", "$outlier_threshold"] }
        }
      }
    }
  },
  // Крок 4: залишити тільки жанри з нетиповими треками
  {
    $match: {
      "outlier_tracks.0": { $exists: true }
    }
  },
  {
    $project: {
      _id: 0,
      genre: "$_id",
      avg_tempo: { $round: ["$avg_tempo", 1] },
      outlier_threshold: { $round: ["$outlier_threshold", 1] },
      outlier_tracks: 1
    }
  },
  { $sort: { genre: 1 } }
]).toArray();

print("Жанри з нетиповими треками:");
printjson(outlierTracks);


// ─────────────────────────────────────────────
// Завдання 4. Треки для фонової роботи
// ─────────────────────────────────────────────
print("\n=== Завдання 4. Треки для фонової роботи ===");

const workTracks = db["tracks"].find(
  {
    "audio_features.loudness":         { $lt: -10 },
    "audio_features.speechiness":      { $lt: 0.1 },
    "audio_features.instrumentalness": { $gt: 0.5 },
    explicit: false
  },
  {
    _id: 0,
    track_name: 1,
    artists: 1,
    "audio_features.loudness": 1,
    "audio_features.speechiness": 1,
    "audio_features.instrumentalness": 1
  }
).toArray();

print("Кількість треків:", workTracks.length);
printjson(workTracks.slice(0, 3));
