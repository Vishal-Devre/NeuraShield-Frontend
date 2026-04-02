import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_storm_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Use one of the storm CSVs
    csv_path = os.path.join(base_dir, "storms_2013.csv")
    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path, low_memory=False)
    
    # Simulate features requested by user based on event details
    np.random.seed(42)
    
    # Ensure magnitude is numeric
    df['magnitude'] = pd.to_numeric(df['magnitude'], errors='coerce').fillna(0)
    
    # Synthesize weather features using magnitude as a baseline signal
    df['wind_speed'] = df['magnitude'] * 1.2 + np.random.normal(20, 10, len(df))
    df['pressure'] = 1013 - (df['magnitude'] * 0.5) + np.random.normal(0, 5, len(df))
    df['humidity'] = 60 + (df['magnitude'] * 0.2) + np.random.normal(0, 10, len(df))
    
    # Ensure reasonable boundaries
    df['humidity'] = df['humidity'].clip(0, 100)
    df['wind_speed'] = df['wind_speed'].clip(0, 300)
    
    # Target: High Risk Storm (e.g. high wind / low pressure / known magnitude > 40)
    df['High_Risk'] = ((df['wind_speed'] > 75) & (df['pressure'] < 1000)).astype(int)
    
    # Features: wind_speed, pressure, humidity
    X = df[['wind_speed', 'pressure', 'humidity']]
    y = df['High_Risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Storm Model trained! Accuracy: {score * 100:.2f}%")
    
    model_path = os.path.join(base_dir, "storm_model.pkl")
    joblib.dump(model, model_path)
    print(f"Saved to {model_path}")

if __name__ == "__main__":
    train_storm_model()
