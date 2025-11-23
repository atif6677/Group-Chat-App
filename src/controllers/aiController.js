const { model } = require("../utils/gemini");

// 1. Predictive Typing (Next-word / Next-phrase suggestions)
exports.getPrediction = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.length < 3) return res.json({ suggestions: [] });

    const prompt = `
You are an autocomplete engine for a modern chat app.
The user typed: "${text}"

Generate 3 short completions (1–4 words).
Tone: friendly, casual, conversational.
Important:
- Include emoji variations when natural (😊👍✨😂🔥🤝).
- Avoid repeating the user’s text.
- Keep suggestions simple and relevant.

Return ONLY the completions separated by |.
Example output:
sure 👍|tomorrow at 5|sounds good 😊
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestions = response.text().split("|").map(s => s.trim()).slice(0, 3);

    res.json({ suggestions });
  } catch (err) {
    console.error("AI Prediction Error:", err);
    res.json({ suggestions: [] });
  }
};

// 2. Smart Replies for Incoming Messages
exports.getSmartReplies = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.json({ replies: [] });

    const prompt = `
You create quick smart-reply buttons for chat.
Incoming message: "${message}"

Generate 3 short replies (max 6 words).
Tone: casual, helpful, natural.
Include emoji when appropriate (😊😅😂👍🔥✨).
Keep replies friendly and concise.

Return ONLY the replies separated by |.
Example:
Yes, I’m coming 👍|Give me 5 mins 😅|Can we do later? 🤔
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const replies = response.text().split("|").map(r => r.trim()).slice(0, 3);

    res.json({ replies });
  } catch (err) {
    console.error("AI Reply Error:", err);
    res.json({ replies: [] });
  }
};
