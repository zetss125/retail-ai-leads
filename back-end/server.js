// ================================
// server.js - Clothing Retail Leads App
// ================================
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(cookieParser());
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

const allowedOrigins = [
  'http://localhost:5173',                  // Default Vite local development
  'http://localhost:3000',                  // Alternative local port
  'http://localhost:5000',                  //  PYTHON FLASK API PORT
  'https://zetss125.github.io',             //  GitHub Pages production site
  'https://signature-retail-app.onrender.com' //  ACTUAL PRODUCTION FRONTEND URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log("CORS Blocked for origin:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ================================
// Mock Database
// ================================
let leadsDatabase = [];

// ================================
// ANN Intelligence Bridge
// ================================
async function getANNScore(location, platform, signals) {
  try {
    // Ensure this matches your Python URL exactly
    const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
      location: location,
      platform: platform,
      signals: signals // Already handled in Python if this is an array
    }, { timeout: 3000 }); // Don't wait forever

    return response.data; 
  } catch (error) {
    // If you see this in the log, your Python server is either 
    // down or crashing on the specific data sent.
    console.error("⚠️ AI Engine Error:", error.response?.data || error.message);
    return { score: 45, urgency: 'MEDIUM' };
  }
}

// Update the Facebook Callback URL for LOCAL development
app.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err, user) => {
    // FIX: Remove the sub-path /moving-leads-app for local dev
    const frontendUrl = 'http://localhost:5173'; 
    if (err || !user) return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    res.redirect(`${frontendUrl}/dashboard?token=${user.accessToken}`);
  })(req, res, next);
});

// Helper to create a retail lead (Used for both Mock and Real analysis)
async function createRetailLead(name = "New Lead", email = null, platform = 'facebook') {
  const cities = ['New York', 'Austin', 'Paris', 'London', 'Toronto'];
  const items = ["Winter Coat", "Silk Dress", "Straight-leg Jeans", "Leather Boots", "Handbag"];
  
  const randomItem = items[Math.floor(Math.random() * items.length)];
  const rawSignals = [
    `Added ${randomItem} to cart`,
    `Asked for ${randomItem} sizing`,
    `Saved ${randomItem} to wishlist`
  ];
  const location = cities[Math.floor(Math.random() * cities.length)];

  // Get the real score from the Python ANN model
  const aiResult = await getANNScore(location, platform, rawSignals);

  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: name,
    email: email || `customer${Math.floor(Math.random() * 9999)}@email.com`,
    location: location,
    platform: platform,
    score: aiResult.score,
    signals: rawSignals,
    urgency: aiResult.urgency,
    timestamp: new Date().toISOString()
  };
}

// ================================
// Facebook Auth Routes
// ================================
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID,
    clientSecret: process.env.FB_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
  },
  (accessToken, refreshToken, profile, done) => {
    return done(null, { profile, accessToken });
  }
));

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_posts'] }));

app.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err, user) => {
    const frontendUrl = 'http://localhost:5173/retail-ai-leads'; 
    if (err || !user) return res.redirect(`${frontendUrl}?error=auth_failed`);
    res.redirect(`${frontendUrl}?token=${user.accessToken}`);
  })(req, res, next);
});

// ================================
// Leads API (The Core Logic)
// ================================

// 1. Analyze specific lead (Mocking the process of pulling FB data)
app.post('/api/analyze-facebook', async (req, res) => {
  try {
    const lead = await createRetailLead("Facebook User", "fb_user@example.com", "facebook");
    leadsDatabase.unshift(lead); // Put newest lead at top
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Get all leads (Seeds with AI-scored data if empty)
app.get('/api/leads', async (req, res) => {
  if (leadsDatabase.length === 0) {
    for (let i = 0; i < 10; i++) {
      const lead = await createRetailLead(`Customer ${i + 1}`);
      leadsDatabase.push(lead);
    }
  }
  res.json(leadsDatabase.sort((a, b) => b.score - a.score));
});

app.delete('/api/leads/:id', (req, res) => {
  leadsDatabase = leadsDatabase.filter(lead => lead.id !== req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Node server on ${PORT}`);
  console.log(`🧠 AI Brain expected at: ${PYTHON_SERVICE_URL}`);
});