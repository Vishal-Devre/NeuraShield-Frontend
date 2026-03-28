import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_earthquake_model():
    csv_path = "USGS-dataset.csv"
    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path)
    
    # Drop rows with missing crucial data
    df = df.dropna(subset=['mag', 'depth', 'latitude', 'longitude'])
    
    # We will predict if an earthquake is 'High Risk' (Magnitude > 4.5)
    # This is a simplified target for our hackathon MVP AI Agent
    df['High_Risk'] = (df['mag'] > 4.5).astype(int)
    
    # Features: Location and Depth characteristics
    X = df[['latitude', 'longitude', 'depth']]
    y = df['High_Risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Earthquake Model trained! Accuracy: {score * 100:.2f}%")
    
    joblib.dump(model, "earthquake_model.pkl")
    print("Saved to earthquake_model.pkl")

if __name__ == "__main__":
    train_earthquake_model()
