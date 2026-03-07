import os
import numpy as np
import pandas as pd
import joblib
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow your Vercel and GitHub Pages domains
CORS(app, resources={r"/*": {"origins": [
    "https://retail-ai-leads.vercel.app", 
    "https://zetss125.github.io",
    "http://localhost:5173",
    "http://localhost:3001"
]}})

# ---------------------------------------------------------
# 1. LOAD AI MODELS & SCALERS
# ---------------------------------------------------------
model = None
encoder = None
vectorizer = None
target_scaler = None

try:
    # Loading models from the root directory
    model = joblib.load('omnilead_gb_model.pkl')
    encoder = joblib.load('encoder.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
    target_scaler = joblib.load('target_scaler.pkl') 
    print("✅ HYBRID MODEL: AI + Business Logic loaded successfully.")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    traceback.print_exc()

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
# 3. ROUTES
# ---------------------------------------------------------

@app.route('/', methods=['GET'])
def health_check():
    """Root endpoint to verify the server is active and models are loaded."""
    status = "Online" if model is not None else "Online (Models Missing)"
    return jsonify({
        "status": status,
        "message": "Signature Retail AI Brain is active",
        "endpoints": ["/predict (POST)"]
    }), 200

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    # Handle CORS preflight request
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        # Safety check for loaded models
        if model is None:
            return jsonify({"error": "AI models not loaded on server"}), 500

        # Extract Inputs
        raw_platform = data.get('platform', 'Facebook')
        platform = str(raw_platform).capitalize() if str(raw_platform).lower() == "facebook" else str(raw_platform)
        location = data.get('location', 'New York')
        signals = data.get('signals', '')
        
        # Format signals into a string
        if isinstance(signals, list):
            signals_str = "; ".join(signals)
        else:
            signals_str = str(signals)
        
        # Clean text for vectorizer
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
        
        # Convert back from 0-1 range to 0-100 using target_scaler
        score_raw = target_scaler.inverse_transform(pred_scaled.reshape(-1, 1))[0][0]
        score = float(score_raw)

        # --- STEP 2: BUSINESS LOGIC OVERRIDE ---
        if sig_count >= 5:
            # If they have 5 or more signals, they are "Gold" leads
            # We start them at 90 and add a bit more for every signal
            score = max(score, 90 + min(9, sig_count)) 
        elif sig_count >= 3:
            # 3-4 signals are strong (75-89)
            score = max(score, 75)
        elif sig_count >= 1:
            # Even 1 signal is better than nothing
            score = max(score, 50)
        elif sig_count == 0:
            score = min(score, 15)

        # Final Clip
        score = max(0, min(100, score)) 

        # Logging for Railway Debugging
        print(f"--- PREDICTION LOG ---")
        print(f"Inputs: {location} | {platform} | Signals: {sig_count}")
        print(f"Result: {int(score)} ({'HIGH' if score >= 75 else 'MEDIUM' if score >= 40 else 'LOW'})")
        print(f"DEBUG: Scaled AI Prediction: {pred_scaled[0]}")
        return jsonify({
            "score": int(score),
            "urgency": "HIGH" if score >= 75 else "MEDIUM" if score >= 40 else "LOW",
            "signals_detected": int(sig_count),
            "status": "success"
        })
        
    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}")
        traceback.print_exc() 
        return jsonify({"error": "Internal server error during prediction"}), 500
       

if __name__ == "__main__":
    # Use the PORT provided by Railway, default to 8080 for local
    port = int(os.environ.get("PORT", 8080))
    # host 0.0.0.0 is required for Railway to expose the service
    app.run(host='0.0.0.0', port=port)