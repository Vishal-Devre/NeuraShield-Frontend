import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_volcano_model():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(base_dir, "volcano.csv")
    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path)
    
    # We will predict if a volcano is 'High Risk' based on its recent eruption history and simulated seismic activity
    # Clean last eruption year
    df['last_eruption_year'] = pd.to_numeric(df['last_eruption_year'], errors='coerce').fillna(0)
    
    # Simulate seismic activity (1-10) for training data as the user requested it as a feature
    np.random.seed(42)
    df['seismic_activity'] = np.random.uniform(1.0, 10.0, len(df))
    
    # Target: High Risk if erupted recently (after 1950) AND high seismic activity
    df['High_Risk'] = ((df['last_eruption_year'] > 1950) & (df['seismic_activity'] > 6.0)).astype(int)
    
    # Features: Location, Eruption History, Seismic Activity
    X = df[['latitude', 'longitude', 'last_eruption_year', 'seismic_activity']]
    y = df['High_Risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Volcano Model trained! Accuracy: {score * 100:.2f}%")
    
    model_path = os.path.join(base_dir, "volcano_model.pkl")
    joblib.dump(model, model_path)
    print(f"Saved to {model_path}")

if __name__ == "__main__":
    train_volcano_model()
