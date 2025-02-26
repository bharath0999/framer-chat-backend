require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());

// 🔹 Secure CORS: Allow ONLY Framer project
const allowedOrigins = [
    "https://your-framer-project.framer.website", // Change to your actual Framer URL
];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        methods: "GET,POST,OPTIONS",
        allowedHeaders: "Content-Type,Authorization",
    })
);

// 🔹 Store API Key securely in environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// 🔹 Middleware: Require API Key for Security
app.use((req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${process.env.SECRET_API_KEY}`) {
        return res.status(403).json({ error: "Unauthorized request" });
    }
    next();
});

// 🔹 Chat API Endpoint (Secure)
app.post("/chat", async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid request format." });
        }

        const response = await axios.post(
            OPENAI_API_URL,
            { model: "gpt-3.5-turbo", messages },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
        );

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("ChatGPT API Error:", error.response?.data || error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// 🔹 Start the Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Server running securely on port ${PORT}`);
});
