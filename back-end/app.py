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
MODEL_PATH = "zetss125/retail-lead-scoring"

model = None
tokenizer = None
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

try:
    print(f"🔄 Initializing Retail AI Brain from {MODEL_PATH}...")

    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)

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
# 2. SIGNAL WEIGHT MAP
#    Mirrors the high-scoring patterns in the training CSV.
#    Used to calibrate the raw softmax score into a proper
#    0-100 range so HIGH leads reliably score 80+.
# ---------------------------------------------------------
HIGH_WEIGHT_SIGNALS = [
    "added",         # "Added X to cart" — strongest purchase intent signal
    "promo code",    # "Used a promo code" — transactional, very high intent
    "inquired about", # "Inquired about stock availability" — urgency signal
    "requested restock", # "Requested restock notification" — high intent
]

MEDIUM_WEIGHT_SIGNALS = [
    "asked for",     # "Asked for sizing" — pre-purchase research
    "saved",         # "Saved to wishlist" — interest but passive
    "viewed",        # "Viewed details" — passive research
    "clicked",       # "Clicked on ad" — top-of-funnel
]

def calculate_signal_boost(signals_str: str) -> float:
    """
    Computes a calibration boost (0.0 to 0.25) based on the
    presence of high-weight signals that the model was trained on.
    This corrects for the softmax compression that occurs when
    the model outputs probabilities clustered in the 0.5-0.7 range.
    """
    s = signals_str.lower()
    boost = 0.0

    for signal in HIGH_WEIGHT_SIGNALS:
        if signal in s:
            boost += 0.06  # +6 points per high-weight signal (max 4 = +24)

    for signal in MEDIUM_WEIGHT_SIGNALS:
        if signal in s:
            boost += 0.02  # +2 points per medium-weight signal

    return min(boost, 0.30)  # Cap total boost at 30 points

# ---------------------------------------------------------
# 3. ROUTES
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

        # --- EXTRACT INPUTS ---
        signals = data.get('signals', '')

        # Normalize signals to a semicolon-separated string
        # (matches exact format the model was trained on in the CSV)
        if isinstance(signals, list):
            signals_str = "; ".join(signals)
        else:
            signals_str = str(signals).strip()

        # ---------------------------------------------------------
        # CRITICAL FIX:
        # Send ONLY the raw signals string to the model —
        # no prefix, no metadata wrapper.
        # The CSV training data was just the signals column directly,
        # e.g. "Added Silk Dress to cart; Viewed Silk Dress details; ..."
        # Adding "Lead from X via Y. Urgency: Z. Signals:" as a prefix
        # introduces tokens the model never saw during training and
        # suppresses high-intent predictions.
        # ---------------------------------------------------------
        context = signals_str

        # --- BERT INFERENCE ---
        inputs = tokenizer(
            context,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        ).to(device)

        with torch.no_grad():
            outputs = model(**inputs)

        # Raw softmax probability for class 1 (High Intent)
        probs = F.softmax(outputs.logits, dim=-1)
        raw_score = probs[0][1].item()  # float between 0.0 and 1.0

        # Apply signal-weight calibration boost
        # This spreads the score distribution to match the CSV's 12-99 range
        boost = calculate_signal_boost(signals_str)
        calibrated_score = min(raw_score + boost, 1.0)

        # Convert to 0-100 integer
        score = int(round(calibrated_score * 100))

        # --- LOGGING ---
        print(f"--- PREDICTION ---")
        print(f"Signals: {signals_str}")
        print(f"Raw softmax score: {round(raw_score * 100, 2)}")
        print(f"Signal boost applied: +{round(boost * 100, 2)}")
        print(f"Final AI Score: {score}")

        # Urgency thresholds match the CSV dataset breakpoints exactly
        if score >= 80:
            urgency = "HIGH"
        elif score >= 45:
            urgency = "MEDIUM"
        else:
            urgency = "LOW"

        return jsonify({
            "score": score,
            "urgency": urgency,
            "status": "success",
            "context_processed": context,
            "debug": {
                "raw_score": round(raw_score * 100, 2),
                "boost_applied": round(boost * 100, 2),
                "final_score": score
            }
        })

    except Exception as e:
        print(f"❌ Prediction Error: {str(e)}")
        traceback.print_exc()
        return jsonify({"error": "Internal server error"}), 500


# ---------------------------------------------------------
# 4. START SERVER
# ---------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port)
