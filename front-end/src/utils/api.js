// src/utils/api.js

// 1. Update the Production URL to your new Clothing Retail backend
const API_BASE_URL = import.meta.env.PROD
  ? 'https://signature-retail-backend.onrender.com' // Replace with your actual Render/Heroku URL
  : 'http://localhost:3001';

/**
 * Fetches all leads from the database, sorted by AI score
 */
export async function fetchLeads() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leads`);
    if (!response.ok) throw new Error('Failed to fetch leads');
    return await response.json();
  } catch (error) {
    console.error("API Error (fetchLeads):", error);
    throw error;
  }
}

/**
 * Sends a Facebook Access Token to the backend to perform 
 * AI analysis on social signals for clothing retail intent.
 */
export async function analyzeFacebookToken(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze-facebook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: token })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'AI Analysis failed');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (analyzeFacebookToken):", error);
    throw error;
  }
}

/**
 * Deletes a lead from the database by ID
 */
export async function deleteLead(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/leads/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete lead');
    return await response.json();
  } catch (error) {
    console.error("API Error (deleteLead):", error);
    throw error;
  }
}