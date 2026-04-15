import os
import torch
import traceback
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/*": {"origins": [
    "https://retail-ai-leads.vercel.app", 
    "https://zetss125.github.io",
    "http://localhost:5173",
    "http://localhost:3001"
]}})

# ---------------------------------------------------------
# 1. LOAD HUGGING FACE MODEL & TOKENIZER
# ---------------------------------------------------------
# Change this to the path where you saved your model (e.g., './retail_model')
# Or use the HF path if you've uploaded it to the Hub
MODEL_PATH = "zetss125/retail-lead-scoring"

model = None
tokenizer = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.to(device)
    model.eval()
    print(f"✅ HUGGING FACE MODEL loaded successfully on {device}")
except Exception as e:
    print(f"❌ Error loading BERT model: {e}")
    traceback.print_exc()

# ---------------------------------------------------------
# 2. ROUTES
# ---------------------------------------------------------

@app.route('/', methods=['GET'])
def health_check():
    status = "Online" if model is not None else "Online (BERT Missing)"
    return jsonify({
        "status": status,
        "message": "Retail AI BERT Brain is active",
        "endpoints": ["/predict (POST)"]
    }), 200

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data or model is None:
            return jsonify({"error": "Data missing or model not loaded"}), 400

        # Extract Inputs (Matches your Vercel/Frontend names)
        location = data.get('location', 'Unknown')
        platform = data.get('platform', 'Web')
        urgency = data.get('urgency', 'MEDIUM')
        signals = data.get('signals', '')

        if isinstance(signals, list):
            signals_str = "; ".join(signals)
        else:
            signals_str = str(signals)

        # --- STEP 1: SERIALIZATION (Same as true_testing_for_capstone_retail.py) ---
        context = f"Lead from {location} via {platform}. Urgency: {urgency}. Signals: {signals_str}"

        # --- STEP 2: BERT PREDICTION ---
        inputs = tokenizer(context, return_tensors="pt", truncation=True, padding=True, max_length=512).to(device)
        
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Get probability for "High Intent" (Index 1)
        probs = F.softmax(outputs.logits, dim=-1)
        score = probs[0][1].item() * 100

        # Logging for Railway
        print(f"--- BERT PREDICTION LOG ---")
        print(f"Context: {context}")
        print(f"Result: {int(score)}% ({'HIGH' if score >= 75 else 'MEDIUM' if score >= 40 else 'LOW'})")

        return jsonify({
            "score": int(score),
            "urgency": "HIGH" if score >= 75 else "MEDIUM" if score >= 40 else "LOW",
            "status": "success",
            "context_processed": context
        })
        
    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}")
        traceback.print_exc() 
        return jsonify({"error": "Internal server error"}), 500
    
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    # Added 'low_cpu_mem_usage' to help Railway handle the 400MB+ model
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_PATH, 
        low_cpu_mem_usage=True
    )
    model.to(device)
    model.eval()
    print(f"✅ CUSTOM RETAIL MODEL loaded from Hugging Face on {device}")
except Exception as e:
    print(f"❌ Error loading BERT model: {e}")
    traceback.print_exc()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)