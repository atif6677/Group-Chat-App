const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Initialize with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, {
  apiVersion: "v1beta", // initial default, you may keep this
});

// Use a supported model name
// e.g. "gemini-2.5-flash" which is listed as valid :contentReference[oaicite:2]{index=2}
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Export individually
exports.model = model;
