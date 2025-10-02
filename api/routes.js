const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/firebase');

const router = express.Router();

// ============================================================================
//  TRANSLATE ENDPOINT (/api/translate)
// ============================================================================
router.post('/translate', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const { mode, text, context, interpretation, sender, receiver } = req.body;
        const personaPrompt = `Your tone should be that of a helpful, direct, and supportive coach. You are truthful but not harsh. Avoid platitudes, overly flowery language, and excessive praise. The primary goal is to empower the user by explaining the 'why' behind communication differences, helping them build skills so they become less dependent on this tool over time.`;
        let fullPrompt = '';

        if (mode === 'draft') {
            if (!text || !context || !sender || !receiver) {
                return res.status(400).json({ error: 'Missing required fields for draft mode.' });
            }
            fullPrompt = `${personaPrompt} The user wants to DRAFT a message. Their style is ${sender}, their audience's style is ${receiver}.
CONTEXT: "${context}"
DRAFT: "${text}"
Your Task: First, provide the rewritten message using HTML for formatting (like <p> and <h3> tags). Then, on a new line, provide the unique separator '|||'. Finally, on a new line, provide the explanation for your changes, also using HTML formatting.`;
        } else if (mode === 'analyze') {
            if (!text || !interpretation || !sender || !receiver) {
                return res.status(400).json({ error: 'Missing required fields for analyze mode.' });
            }
            fullPrompt = `${personaPrompt} The user wants to ANALYZE a message. The message is from a ${sender} person for a ${receiver} user.
MESSAGE: "${text}"
USER'S INTERPRETATION: "${interpretation}"
Your Task: First, provide a multi-part analysis and suggested response as a single HTML string. Then, on a new line, provide the unique separator '|||'. Finally, on a new line, provide the explanation for your work, also using HTML formatting.`;
        } else {
            return res.status(400).json({ error: 'Invalid mode specified. Must be "draft" or "analyze".' });
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-pro-latest' });
        const result = await model.generateContent(fullPrompt);
        const responseText = await result.response.text();
        const parts = responseText.split('|||');

        if (parts.length < 2) {
           throw new Error("AI response did not contain the expected separator.");
        }

        res.status(200).json({
            response: parts[0].trim(),
            explanation: parts[1].trim()
        });

    } catch (error) {
        console.error('Error calling Gemini AI in /translate:', error);
        res.status(500).json({ error: 'An error occurred while communicating with the AI service.' });
    }
});

// ============================================================================
//  CHAT ENDPOINT (/api/chat)
// ============================================================================
router.post('/chat', async (req, res) => {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro-latest" });
        const { history, message } = req.body;

        if (!Array.isArray(history) || typeof message !== 'string') {
            return res.status(400).json({ error: "Invalid request body: 'history' must be an array and 'message' must be a string." });
        }

        const historyString = history.map(turn => {
            const role = turn.role === 'user' ? 'User' : 'Coach';
            return `${role}: ${turn.content}`;
        }).join('\n');

        const currentConversation = historyString ? `${historyString}\nUser: ${message}` : `User: ${message}`;
        const personaPrompt = `Your tone should be that of a helpful, direct, and supportive coach. You are truthful but not harsh. Avoid platitudes, overly flowery language, and excessive praise. The primary goal is to empower the user by explaining the 'why' behind communication differences, helping them build skills so they become less dependent on this tool over time.`;
        const fullPrompt = `${personaPrompt} You are in a conversation. The history of the conversation is below. Your task is to provide the next response as the 'Coach'. Your response must be a single, cohesive paragraph that ends with a single question.
--- CONVERSATION HISTORY ---
${currentConversation}
Coach:`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const text = response.text();
        
        res.status(200).json({ response: text });

    } catch(error) {
        console.error('Error calling Gemini AI in /chat:', error);
        res.status(500).json({ error: 'An error occurred while communicating with the AI service.' });
    }
});

// ============================================================================
//  CONTACT SAVE ENDPOINT (/api/contact-save)
// ============================================================================
router.post('/contact-save', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required to save.' });
    }
    const newSubmission = {
      name,
      email,
      subject,
      message,
      submittedAt: new Date().toISOString(),
    };
    await db.collection('contacts').add(newSubmission);
    res.status(200).json({ message: 'Submission saved successfully.' });
  } catch (error) {
    console.error('Error in /contact-save endpoint:', error);
    res.status(500).json({ error: 'Failed to save contact submission.' });
  }
});

// ============================================================================
//  FEEDBACK ENDPOINT (/api/feedback)
// ============================================================================
router.post('/feedback', async (req, res) => {
  try {
    const { responseRating, responseComment, explanationRating, explanationComment, mode } = req.body;

    if (!responseRating && !explanationRating) {
      return res.status(400).json({ error: 'At least one rating is required.' });
    }

    const newFeedback = {
      responseRating: responseRating || null,
      responseComment: responseComment || null,
      explanationRating: explanationRating || null,
      explanationComment: explanationComment || null,
      mode: mode || null,
      submittedAt: new Date().toISOString(),
    };

    await db.collection('feedback').add(newFeedback);
    
    res.status(201).json({ message: 'Feedback submitted successfully.' });

  } catch (error) {
    console.error('Error in /feedback endpoint:', error);
    res.status(500).json({ error: 'An error occurred while saving feedback.' });
  }
});

module.exports = router;