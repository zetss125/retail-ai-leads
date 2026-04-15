import os
import torch
import traceback
import torch.nn.functional as F
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow your specific frontend domains
CORS(app, resources={r"/*": {"origins": [
    "https://retail-ai-leads.vercel.app", 
    "https://zetss125.github.io",
    "http://localhost:5173",
    "http://localhost:3001"
]}})

# ---------------------------------------------------------
# 1. LOAD HUGGING FACE MODEL & TOKENIZER
# ---------------------------------------------------------
# Your specific Hugging Face repository
MODEL_PATH = "zetss125/retail-lead-scoring"

model = None
tokenizer = None
# Railway standard tiers use CPU; this ensures portability
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    print(f"🔄 Initializing Retail AI Brain from {MODEL_PATH}...")
    
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    
    # Use low_cpu_mem_usage to prevent Railway from hitting RAM limits
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_PATH, 
        low_cpu_mem_usage=True
    )
    
    model.to(device)
    model.eval()
    
    print(f"✅ FINAL RETAIL BRAIN loaded successfully on {device}")
except Exception as e:
    print(f"❌ CRITICAL ERROR: Could not load BERT model: {e}")
    traceback.print_exc()

# ---------------------------------------------------------
# 2. ROUTES
# ---------------------------------------------------------

@app.route('/', methods=['GET'])
def health_check():
    """Verify the server is live and the model is in memory."""
    status = "Online" if model is not None else "Online (BERT Missing)"
    return jsonify({
        "status": status,
        "message": "Retail AI BERT Brain is active",
        "endpoints": ["/predict (POST)"]
    }), 200

@app.route('/predict', methods=['POST', 'OPTIONS'])
def predict():
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data or model is None:
            return jsonify({"error": "Data missing or model not loaded"}), 400

        # Extract Inputs (Defaults ensure the app doesn't crash if fields are missing)
        location = data.get('location', 'Unknown')
        platform = data.get('platform', 'Web')
        urgency = data.get('urgency', 'MEDIUM')
        signals = data.get('signals', '')

        # Format signals (Handle both list and string inputs)
        if isinstance(signals, list):
            signals_str = "; ".join(signals)
        else:
            signals_str = str(signals)

        # --- STEP 1: SERIALIZATION ---
        # This string format must match exactly how you fine-tuned the model
        context = f"Lead from {location} via {platform}. Urgency: {urgency}. Signals: {signals_str}"

        # --- STEP 2: BERT INFERENCE ---
        inputs = tokenizer(
            context, 
            return_tensors="pt", 
            truncation=True, 
            padding=True, 
            max_length=512
        ).to(device)
        
        with torch.no_grad():
            outputs = model(**inputs)
        
        # Convert raw logits to a 0-100 score
        # Index 1 is the 'High Intent' class
        probs = F.softmax(outputs.logits, dim=-1)
        score = probs[0][1].item() * 100

        # --- LOGGING FOR RAILWAY DEBUGGING ---
        print(f"--- PREDICTION ---")
        print(f"Context: {context}")
        print(f"AI Score: {int(score)}%")

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

# ---------------------------------------------------------
# 3. START SERVER
# ---------------------------------------------------------
if __name__ == "__main__":
    # Railway provides the PORT environment variable
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)