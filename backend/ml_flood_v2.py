import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_flood_v2_model():
    csv_path = "Flood.csv"
    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path)
    
    # We will predict High Risk if Annual Precipitation is very high (> 1500mm)
    # or Precipitation of Wettest Month is > 300mm
    df['High_Risk'] = ((df['Annual Precipitation'] > 1500) | (df['Precipitation of Wettest Month'] > 300)).astype(int)
    
    # Let's use some key hydrological features
    features = ['Annual Precipitation', 'Precipitation of Wettest Month', 'Drainage Area', 'Annual Mean Temperature']
    
    df = df.dropna(subset=features)
    X = df[features]
    y = df['High_Risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Flood V2 Model trained! Accuracy: {score * 100:.2f}%")
    
    joblib.dump(model, "flood_v2_model.pkl")
    print("Saved to flood_v2_model.pkl")

if __name__ == "__main__":
    train_flood_v2_model()
