require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = "asst_1bzW6Cul4Ngrg1HtSEA2ZZQ9";
const OPENAI_API_URL = "https://api.openai.com/v1/threads";

const HEADERS = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
};

// 📌 Functions for Personal Links
async function bookCall() {
    return "👉 Book a call with Bharath: https://cal.com/bharaths-design";
}

async function getPortfolio() {
    return "🌐 View Bharath's portfolio: https://www.designwithbharath.com/";
}

async function getEmail() {
    return "📧 Contact Bharath via email: https://Designwithbharath@gmail.com/";
}

async function getLinkedIn() {
    return "💼 Connect with Bharath on LinkedIn: https://www.linkedin.com/in/bharath-kumar79/";
}

async function getResume() {
    return "📄 Download Bharath's resume: https://drive.google.com/file/d/1ttmiu9g53oUoXNPDDOAKd7GTkOr0g13c/view";
}

// ✅ Chat Endpoint - Handles Function Calls
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message parameter is missing." });
        }

        console.log("Received message:", message);

        // Step 1: Create a thread
        const threadResponse = await axios.post(OPENAI_API_URL, {}, { headers: HEADERS });
        const threadId = threadResponse.data.id;

        // Step 2: Send user's message to the assistant
        await axios.post(`${OPENAI_API_URL}/${threadId}/messages`, { role: "user", content: message }, { headers: HEADERS });

        // Step 3: Run the assistant
        const runResponse = await axios.post(`${OPENAI_API_URL}/${threadId}/runs`, { assistant_id: ASSISTANT_ID }, { headers: HEADERS });
        const runId = runResponse.data.id;

        // Step 4: Wait for the assistant's response
        let completed = false;
        let assistantReply = "";

        while (!completed) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait before checking

            const checkStatus = await axios.get(`${OPENAI_API_URL}/${threadId}/runs/${runId}`, { headers: HEADERS });

            if (checkStatus.data.status === "completed") {
                const messagesResponse = await axios.get(`${OPENAI_API_URL}/${threadId}/messages`, { headers: HEADERS });
                const messages = messagesResponse.data.data;
                assistantReply = messages[0].content[0].text.value;
                completed = true;

                // 📌 Handle Function Calls
                const functionCall = messages[0].function_call;
                if (functionCall) {
                    switch (functionCall.name) {
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
                            assistantReply = "Sorry, I couldn't recognize the function.";
                    }
                }
            }
        }

        res.json({ reply: assistantReply });

    } catch (error) {
        console.error("ChatGPT API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Unknown error" });
    }
});

// ✅ Start Server
app.listen(10000, () => console.log("✅ Server running on port 10000"));
