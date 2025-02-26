require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());

// Security: Check if API key is set
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("❌ OPENAI_API_KEY is missing. Please set it in Render.");
  process.exit(1);
}

const HEADERS = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  "Content-Type": "application/json",
};

const allowedOrigins = ["https://your-framer-site.framer.website", "https://yourfrontend.com"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("❌ Not allowed by CORS"));
    }
  }
}));

const functionMap = {
  "book_call": async () => `👉 <a href="https://cal.com/bharaths-design" target="_blank">Book a call</a>`,
  "get_portfolio": async () => `🌐 <a href="https://www.designwithbharath.com/" target="_blank">View Portfolio</a>`,
  "get_email": async () => `📧 <a href="mailto:Designwithbharath@gmail.com">Email Bharath</a>`,
  "get_linkedin": async () => `💼 <a href="https://www.linkedin.com/in/bharath-kumar79/" target="_blank">LinkedIn</a>`,
  "get_resume": async () => `📄 <a href="https://drive.google.com/file/d/1ttmiu9g53oUoXNPDDOAKd7GTkOr0g13c/view" target="_blank">Download Resume</a>`,
};

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "❌ 'messages' array required." });
    }

    messages.unshift({
      role: "system",
      content: `
You are Bharath's assistant with access to functions: book_call, get_portfolio, get_email, get_linkedin, get_resume.
Use these functions directly instead of just mentioning them.
`,
    });

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages,
      functions: Object.keys(functionMap).map((name) => ({ name, parameters: { type: "object", properties: {} }, required: [] })),
      function_call: "auto",
    }, { headers: HEADERS });

    const assistantMessage = response.data.choices[0].message;
    let assistantReply = assistantMessage.content || "";

    if (assistantMessage.function_call) {
      const functionName = assistantMessage.function_call.name;
      assistantReply = functionMap[functionName] ? await functionMap[functionName]() : "❌ Unknown function.";
    }

    res.json({ reply: assistantReply });
  } catch (error) {
    console.error("❌ API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "❌ Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
