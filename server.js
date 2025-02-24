require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Your OpenAI API key (set in Render’s environment variables or a local .env)
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// ✅ Common headers for axios requests
const HEADERS = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
};

// -------------------------------------------------------
// 1) Your Existing Link Functions
// -------------------------------------------------------
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

// -------------------------------------------------------
// 2) OpenAI Function Descriptions
//    This tells ChatGPT exactly what each function does.
// -------------------------------------------------------
const OPENAI_FUNCTIONS = [
    {
        name: "book_call",
        description: "Provides a link to book a call with Bharath.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_portfolio",
        description: "Provides Bharath's portfolio link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_email",
        description: "Provides Bharath's email address link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_linkedin",
        description: "Provides Bharath's LinkedIn profile link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_resume",
        description: "Provides Bharath's resume link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
];

// -------------------------------------------------------
// 3) The /chat Endpoint
//    - Uses GPT-3.5-Turbo with function calling
//    - “auto” function_call parameter
// -------------------------------------------------------
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message parameter is missing." });
        }

        console.log("📨 Received message from user:", message);

        // ✅ Step A: Make a request to the Chat Completions API
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: `
You are Bharath's helpful assistant. You have access to the following functions:
- book_call
- get_portfolio
- get_email
- get_linkedin
- get_resume

Whenever a user asks for something related to scheduling a call, contact details, or a portfolio/resume link, 
you MUST call the relevant function automatically instead of just mentioning it. 
Return normal text for all other answers. 
Only call a function if it's clearly relevant to the user's query. 
Do NOT list the function names in your final message—call them directly!
                        `,
                    },
                    { role: "user", content: message },
                ],
                functions: OPENAI_FUNCTIONS,
                function_call: "auto", // Let the model decide to call
            },
            { headers: HEADERS }
        );

        // ✅ Step B: Extract the assistant's response
        const assistantMessage = response.data.choices[0].message;
        let assistantReply = assistantMessage.content || ""; // default to text content

        // ✅ Step C: If a function is called, run the matching link function
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
                    assistantReply = "Sorry, I couldn't recognize that function call.";
            }
        }

        // ✅ Step D: Send the final reply (either text or function result)
        res.json({ reply: assistantReply });

    } catch (error) {
        console.error("❌ ChatGPT API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Unknown error" });
    }
});

// -------------------------------------------------------
// 4) Start the Express Server
// -------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
