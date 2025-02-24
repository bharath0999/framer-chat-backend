require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// 1. Keep your existing link functions
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

// 2. Define the function “schemas” so OpenAI knows your functions exist
const OPENAI_FUNCTIONS = [
    {
        name: "book_call",
        description: "Returns a link to book a call with Bharath.",
        // No parameters needed, so we declare an empty object
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_portfolio",
        description: "Returns Bharath's portfolio link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_email",
        description: "Returns Bharath's email address link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_linkedin",
        description: "Returns Bharath's LinkedIn profile link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
    {
        name: "get_resume",
        description: "Returns Bharath's resume link.",
        parameters: {
            type: "object",
            properties: {},
            required: [],
        },
    },
];

// ✅ Chat Endpoint
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message parameter is missing." });
        }

        // 3. Send a standard ChatCompletion call, but with function definitions:
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo-0613", // or newer
                messages: [
                    { role: "system", content: "You are Bharath's helpful assistant." },
                    { role: "user", content: message },
                ],
                functions: OPENAI_FUNCTIONS,
                function_call: "auto", // Let the model decide whether to call a function
            },
            {
                headers: {
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        const assistantMessage = response.data.choices[0].message;
        let assistantReply = "";

        // 4. Check if the model wants to call one of your functions:
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
        } else {
            // 5. If no function is called, it's regular text:
            assistantReply = assistantMessage.content;
        }

        res.json({ reply: assistantReply });
    } catch (error) {
        console.error("ChatGPT API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Unknown error" });
    }
});

// ✅ Start Server
app.listen(10000, () => console.log("✅ Server running on port 10000"));
