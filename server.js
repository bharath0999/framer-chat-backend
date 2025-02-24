// ✅ Import dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ OpenAI Config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const HEADERS = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
};

// 📌 Personal Links (Function Definitions)
async function bookCall() {
    return `👉 <a href="https://cal.com/bharaths-design" target="_blank" rel="noopener noreferrer">Book a call with Bharath</a>`;
}

async function getPortfolio() {
    return `🌐 <a href="https://www.designwithbharath.com/" target="_blank" rel="noopener noreferrer">View Bharath's portfolio</a>`;
}

async function getEmail() {
    return `📧 <a href="mailto:Designwithbharath@gmail.com">Contact Bharath via email</a>`;
}

async function getLinkedIn() {
    return `💼 <a href="https://www.linkedin.com/in/bharath-kumar79/" target="_blank" rel="noopener noreferrer">Connect with Bharath on LinkedIn</a>`;
}

async function getResume() {
    return `📄 <a href="https://drive.google.com/file/d/1ttmiu9g53oUoXNPDDOAKd7GTkOr0g13c/view" target="_blank" rel="noopener noreferrer">Download Bharath's resume</a>`;
}

// 📌 OpenAI Function Descriptions
const OPENAI_FUNCTIONS = [
    {
        name: "book_call",
        description: "Provides a link to book a call with Bharath.",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "get_portfolio",
        description: "Provides Bharath's portfolio link.",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "get_email",
        description: "Provides Bharath's email address link.",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "get_linkedin",
        description: "Provides Bharath's LinkedIn profile link.",
        parameters: { type: "object", properties: {}, required: [] },
    },
    {
        name: "get_resume",
        description: "Provides Bharath's resume link.",
        parameters: { type: "object", properties: {}, required: [] },
    },
];

// ✅ POST Endpoint: Chat with OpenAI
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message parameter is missing." });
        }

        console.log("📨 Received message:", message);

        // ✅ Call OpenAI API with function-calling capability
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "You are Bharath's helpful assistant, capable of sharing links." },
                    { role: "user", content: message },
                ],
                functions: OPENAI_FUNCTIONS,
                function_call: "auto",
            },
            { headers: HEADERS }
        );

        // ✅ Extract Assistant Response
        const assistantMessage = response.data.choices[0].message;
        let assistantReply = assistantMessage.content || "";

        // 📌 Handle Function Calls
        if (assistantMessage.function_call) {
            const functionName = assistantMessage.function_call.name;

            switch (functionName) {
                case "book_call":
                    assistantReply = await bookCall();
                    break;
                case "get_portfolio":
                    assistantReply = await getPortfolio();
                    break;
                case "get_email":
                    assistantReply = await getEmail();
                    break;
                case "get_linkedin":
                    assistantReply = await getLinkedIn();
                    break;
                case "get_resume":
                    assistantReply = await getResume();
                    break;
                default:
                    assistantReply = "Sorry, I couldn't recognize that function.";
            }
        }

        // ✅ Send Response
        res.json({ reply: assistantReply });

    } catch (error) {
        console.error("❌ ChatGPT API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Unknown error" });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
