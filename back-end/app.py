import os
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------
# 1. LOAD AI MODELS & SCALERS
# ---------------------------------------------------------
try:
    # We now load the Target Scaler to handle the 0-1 vs 0-100 conversion
    model = joblib.load('omnilead_gb_model.pkl')
    encoder = joblib.load('encoder.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    target_scaler = joblib.load('target_scaler.pkl') 
    print("✅ HYBRID MODEL: AI + Business Logic loaded successfully.")
except Exception as e:
    print(f"❌ Error loading models: {e}")

# ---------------------------------------------------------
# 2. HELPER: CLEAN SIGNALS
# ---------------------------------------------------------
def clean_signals(text):
    if not text: return ""
    text = str(text).lower()
    items = ["winter coat", "silk dress", "straight-leg jeans", "leather boots", 
             "linen shirt", "handbag", "running sneakers", "trench coat", "cashmere sweater"]
    for item in items:
        text = text.replace(item, "item")
    return " ".join(text.split())

# ---------------------------------------------------------
# 3. PREDICTION ENDPOINT
# ---------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Extract Inputs
        raw_platform = data.get('platform', 'Facebook')
        platform = str(raw_platform).capitalize() if str(raw_platform).lower() == "facebook" else str(raw_platform)
        location = data.get('location', 'New York')
        signals = data.get('signals', '')
        signals_str = "; ".join(signals) if isinstance(signals, list) else str(signals)
        
        # Clean
        cleaned_text = clean_signals(signals_str)
        
        # Transform Features
        input_df = pd.DataFrame([[location, platform]], columns=['Location', 'Platform'])
        cat_features = encoder.transform(input_df)
        sig_features = vectorizer.transform([cleaned_text]).toarray()
        
        # Engagement Metric (0.0 to 1.0 range for the AI)
        sig_count = np.sum(sig_features > 0)
        engagement_val = sig_count / 5.0 
        
        # Prepare Input for Model
        X_input = np.hstack([cat_features, sig_features, [[engagement_val]]])

        # --- STEP 1: AI PREDICTION ---
        pred_scaled = model.predict(X_input)
        # Convert back from 0-1 range to 0-100
        score = target_scaler.inverse_transform(pred_scaled.reshape(-1, 1))[0][0]

        # --- STEP 2: BUSINESS LOGIC OVERRIDE (The Fix) ---
        # If the AI is being too conservative, we force the score into the correct tier
        if sig_count >= 6:
            # High activity MUST be high score (85-99)
            score = max(score, 85 + min(14, sig_count * 2))
        elif sig_count >= 4:
            # Medium-High activity (70-84)
            score = max(score, 70)
        elif sig_count == 0:
            # No activity MUST be low score
            score = min(score, 15)

        # Final Clip
        score = max(0, min(100, score)) 

        # Logging for Debugging
        print(f"\n--- HYBRID PREDICTION ---")
        print(f"Signals Detected: {int(sig_count)}")
        print(f"Base AI Score: {int(pred_scaled[0] * 100)}")
        print(f"Final Hybrid Score: {int(score)}")
        print(f"--------------------------")

        return jsonify({
            "score": int(score),
            "urgency": "HIGH" if score >= 75 else "MEDIUM" if score >= 40 else "LOW",
            "signals_detected": int(sig_count),
            "status": "success"
        })
        
    except Exception as e:
        import traceback
        print(f"❌ Prediction Error: {e}")
        traceback.print_exc() 
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)