// ================================
// server.js - Clothing Retail Leads App
// ================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();

// Use process.env.PORT for local, but Vercel manages this automatically in prod
const PORT = process.env.PORT || 3001;
// Update this in Vercel Env Variables to your Python Render URL
const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:5000';

// ================================
// Middleware
// ================================
app.use(express.json());
app.use(cookieParser());

// Production-ready session config
app.use(session({ 
  secret: process.env.SESSION_SECRET || 'signature-leads-secret', 
  resave: false, 
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax'
  }
}));

app.use(passport.initialize());
app.use(passport.session());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://zetss125.github.io',
  'https://signature-retail-app.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// ================================
// Mock Database (Note: Reset on every Vercel sleep)
// ================================
let leadsDatabase = [];

// ================================
// ANN Intelligence Bridge
// ================================
async function getANNScore(location, platform, signals) {
  try {
    const response = await axios.post(`${PYTHON_SERVICE_URL}/predict`, {
      location,
      platform,
      signals
    }, { timeout: 3000 });
    return response.data; 
  } catch (error) {
    console.error("⚠️ AI Engine Error:", error.message);
    return { score: 45, urgency: 'MEDIUM' };
  }
}

// ================================
// Facebook Auth Configuration
// ================================
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

if (process.env.FB_APP_ID && process.env.FB_APP_SECRET) {
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
}

// ================================
// Routes
// ================================

app.get('/', (req, res) => res.json({ message: "Retail AI API Live" }));

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'user_posts'] }));

app.get('/auth/facebook/callback', (req, res, next) => {
  passport.authenticate('facebook', (err, user) => {
    // Redirect to production GitHub pages or local dev
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://zetss125.github.io/retail-ai-leads' 
      : 'http://localhost:5173';
    
    if (err || !user) return res.redirect(`${frontendUrl}/login?error=auth_failed`);
    res.redirect(`${frontendUrl}/dashboard?token=${user.accessToken}`);
  })(req, res, next);
});

async function createRetailLead(name = "New Lead", email = null, platform = 'facebook') {
  const cities = ['New York', 'Austin', 'Paris', 'London', 'Toronto'];
  const items = ["Winter Coat", "Silk Dress", "Straight-leg Jeans", "Leather Boots", "Handbag"];
  const randomItem = items[Math.floor(Math.random() * items.length)];
  const location = cities[Math.floor(Math.random() * cities.length)];
  const rawSignals = [`Added ${randomItem} to cart`, `Saved ${randomItem} to wishlist`];

  const aiResult = await getANNScore(location, platform, rawSignals);

  return {
    id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    email: email || `customer${Math.floor(Math.random() * 9999)}@email.com`,
    location,
    platform,
    score: aiResult.score,
    signals: rawSignals,
    urgency: aiResult.urgency,
    timestamp: new Date().toISOString()
  };
}

app.post('/api/analyze-facebook', async (req, res) => {
  try {
    const lead = await createRetailLead("Facebook User", "fb_user@example.com", "facebook");
    leadsDatabase.unshift(lead);
    res.json({ success: true, lead });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/leads', async (req, res) => {
  if (leadsDatabase.length === 0) {
    for (let i = 0; i < 5; i++) {
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

// ================================
// VERCEL COMPATIBILITY
// ================================
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Local server on ${PORT}`);
  });
}

// Crucial for Vercel deployment
module.exports = app;