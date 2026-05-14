// scripts/02_transform.js
// Запуск: mongosh "mongodb+srv://valeriia_goit:Lerika123@cluster0.fkmtr2j.mongodb.net/?appName=Cluster0" --file scripts/02_transform.js

const db = db.getSiblingDB("spotify");

// 1. Видалити стару колекцію tracks якщо існує
db["tracks"].drop();
print("Колекцію tracks видалено (або вона не існувала).");

// 2–6. Трансформація через Aggregation Pipeline
db["tracks_raw"].aggregate([

  // 2. Проєкція потрібних полів
  {
    $project: {
      _id: 0,
      track_id: 1,
      track_name: 1,
      album_name: 1,
      explicit: 1,
      popularity: 1,
      duration_ms: 1,
      track_genre: 1,
      artists_raw: "$artists",

      // Аудіо-характеристики (тимчасово залишаємо для вкладення)
      danceability: 1,
      energy: 1,
      loudness: 1,
      speechiness: 1,
      acousticness: 1,
      instrumentalness: 1,
      liveness: 1,
      valence: 1,
      tempo: 1,
      key: 1,
      mode: 1,
      time_signature: 1
    }
  },

  // 3. Розбиття рядка артистів на масив
  {
    $addFields: {
      artists: {
        $map: {
          input: { $split: ["$artists_raw", ";"] },
          as: "name",
          in: { $trim: { input: "$$name" } }
        }
      }
    }
  },

  // 4. Формування audio_features, duration_sec, popularity_tier
  {
    $addFields: {
      audio_features: {
        danceability:     "$danceability",
        energy:           "$energy",
        loudness:         "$loudness",
        speechiness:      "$speechiness",
        acousticness:     "$acousticness",
        instrumentalness: "$instrumentalness",
        liveness:         "$liveness",
        valence:          "$valence",
        tempo:            "$tempo",
        key:              "$key",
        mode:             "$mode",
        time_signature:   "$time_signature"
      },
      duration_sec: {
        $round: [{ $divide: ["$duration_ms", 1000] }, 1]
      },
      popularity_tier: {
        $switch: {
          branches: [
            { case: { $gte: ["$popularity", 70] }, then: "high" },
            { case: { $gte: ["$popularity", 40] }, then: "medium" }
          ],
          default: "low"
        }
      }
    }
  },

  // 5. Прибрати плоскі аудіо-поля та artists_raw
  {
    $unset: [
      "artists_raw",
      "danceability",
      "energy",
      "loudness",
      "speechiness",
      "acousticness",
      "instrumentalness",
      "liveness",
      "valence",
      "tempo",
      "key",
      "mode",
      "time_signature"
    ]
  },

  // 6. Зберегти результат у колекцію tracks
  {
    $out: "tracks"
  }

]);

// 7. Перевірка результату
print("Кількість документів у tracks:", db["tracks"].countDocuments());
print("Приклад документа:");
printjson(db["tracks"].findOne());