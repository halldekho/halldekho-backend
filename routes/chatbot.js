const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// ✅ Optional fast response for known questions
function getHalldekhoReply(message) {
  const lower = message.toLowerCase();

  if (lower.includes("what is halldekho")) {
    return "Halldekho is an online platform to discover, compare, and book marriage halls with ease.";
  }
  if (lower.includes("who is the founder of halldekho") || lower.includes("founder of halldekho") || lower.includes("founder of hall dekho")) {
    return "Halldekho was founded by Naman Gujral.";
  }
  if (lower.includes("who invented you")) {
    return "A team at Halldekho invented me.";
  }
  if (lower.includes("how does halldekho work") || lower.includes("how halldekho works")) {
    return "You can search for halls by location, view pricing, photos, and book appointments directly on Halldekho.";
  }

  return null;
}

// ✅ Gemini intent classification
async function classifyIntent(message) {
  const prompt = `Classify the following message strictly into one of the following: "wedding_query", "small_talk", or "irrelevant".\n\nMessage: "${message}"`;

  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const label = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toLowerCase();
    return label;
  } catch (error) {
    console.error("Intent classification error:", error.message);
    return "irrelevant";
  }
}

// ✅ Main chatbot endpoint
router.post('/chatbot', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid input message' });
  }

  // 1. Shortcut: static Halldekho answers
  const halldekhoReply = getHalldekhoReply(message);
  if (halldekhoReply) {
    return res.json({ reply: halldekhoReply });
  }

  // 2. Classify intent
  const intent = await classifyIntent(message);

  // 3. Handle rejection
  if (intent === 'irrelevant') {
    return res.json({
      reply: "I'm here to help with wedding or Halldekho-related queries. Please ask accordingly."
    });
  }

  // 4. Prompt creation based on intent
  const prompt =
    intent === 'small_talk'
      ? `Reply briefly and casually to this message: "${message}"`
      : `Answer briefly in 4-5 lines only in plain text. Do not use any special characters like *, -, or markdown. Just provide clean sentences. Question: "${message}"`;

  // 5. Get response from Gemini
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [{ parts: [{ text: prompt }] }]
      },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const rawReply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Sorry, I couldn't generate a proper response.";

    res.json({ reply: rawReply.replace(/\\n/g, '\n') });

  } catch (error) {
    console.error('Gemini API Error:', error.response?.data || error.message);
    res.status(500).json({
      reply: 'Something went wrong while contacting the AI service. Please try again later.',
    });
  }
});

module.exports = router;

