# scripts/01_load_data.py
import os
import kagglehub
import pandas as pd
from pymongo import MongoClient
from tqdm import tqdm
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.environ["MONGO_URI"]
DB_NAME = "spotify"
BATCH_SIZE = 1000

# Download latest version from Kaggle
print("Downloading dataset from Kaggle...")
dataset_path = kagglehub.dataset_download("maharshipandya/-spotify-tracks-dataset")
print("Path to dataset files:", dataset_path)

# Find the CSV file in the downloaded path
csv_files = [f for f in os.listdir(dataset_path) if f.endswith(".csv")]
if not csv_files:
    raise FileNotFoundError(f"No CSV files found in {dataset_path}")
CSV_PATH = os.path.join(dataset_path, csv_files[0])
print(f"Using CSV: {CSV_PATH}")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

# Drop collection if exists — for idempotent re-runs
db["tracks_raw"].drop()

df = pd.read_csv(CSV_PATH)
print(f"Завантажуємо {len(df)} треків...")

# Type casting
df["explicit"] = df["explicit"].astype(bool)

int_cols = ["popularity", "duration_ms", "key", "mode", "time_signature"]
for col in int_cols:
    df[col] = df[col].astype(int)

float_cols = [
    "danceability", "energy", "loudness", "speechiness",
    "acousticness", "instrumentalness", "liveness",
    "valence", "tempo"
]
for col in float_cols:
    df[col] = df[col].astype(float)

# Remove records with missing artist or track name
query = df["artists"].isna() | df["track_name"].isna()
records = df[~query].to_dict("records")

# Insert in batches to avoid memory issues
for i in tqdm(range(0, len(records), BATCH_SIZE)):
    db["tracks_raw"].insert_many(records[i : i + BATCH_SIZE])

print(f"Завантажено документів: {db['tracks_raw'].count_documents({})}")
print("Приклад документа:")
print(db["tracks_raw"].find_one())