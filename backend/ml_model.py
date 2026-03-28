import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

def train_flood_model():
    csv_path = "rainfall-dataset-india.csv"
    if not os.path.exists(csv_path):
        print(f"Dataset {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path)
    
    # We will use the monthly rainfall to predict Flood Risk
    # Let's define "Flood" (1) as years where Jun-Sep rainfall > 900mm (Arbitrary threshold for hackathon)
    df['Flood_Risk'] = (df['Jun-Sep'] > 900).astype(int)
    
    # Features (e.g., using early months to predict later flood risk, or simply monthly totals)
    X = df[['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']]
    y = df['Flood_Risk']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    score = model.score(X_test, y_test)
    print(f"Model trained! Accuracy: {score * 100:.2f}%")
    
    joblib.dump(model, "flood_model.pkl")
    print("Saved to flood_model.pkl")

if __name__ == "__main__":
    train_flood_model()
