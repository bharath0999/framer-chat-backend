require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = "asst_1bzW6Cul4Ngrg1HtSEA2ZZQ9"; // Replace with your actual OpenAI Assistant ID
const OPENAI_API_URL = "https://api.openai.com/v1/threads";

const HEADERS = {
    Authorization: `Bearer ${OPENAI_API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2" // ✅ Required header for Assistants API
};

// Route to interact with the AI Assistant
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message parameter is missing." });
        }

        console.log("Received message:", message);

        // Step 1: Create a thread
        const threadResponse = await axios.post(OPENAI_API_URL, {}, { headers: HEADERS });
        console.log("Thread Response:", threadResponse.data);

        const threadId = threadResponse.data.id;

        // Step 2: Send user's message to the assistant
        await axios.post(
            `${OPENAI_API_URL}/${threadId}/messages`,
            { role: "user", content: message },
            { headers: HEADERS }
        );

        // Step 3: Run the assistant
        const runResponse = await axios.post(
            `${OPENAI_API_URL}/${threadId}/runs`,
            { assistant_id: ASSISTANT_ID },
            { headers: HEADERS }
        );

        console.log("Run Response:", runResponse.data);
        const runId = runResponse.data.id;

        // Step 4: Wait for the assistant's response
        let completed = false;
        let assistantReply = "";

        while (!completed) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking

            const checkStatus = await axios.get(
                `${OPENAI_API_URL}/${threadId}/runs/${runId}`,
                { headers: HEADERS }
            );

            console.log("Check Status Response:", checkStatus.data);

            if (checkStatus.data.status === "completed") {
                const messagesResponse = await axios.get(
                    `${OPENAI_API_URL}/${threadId}/messages`,
                    { headers: HEADERS }
                );

                console.log("Messages Response:", messagesResponse.data);

                assistantReply = messagesResponse.data.data[0].content[0].text.value;
                completed = true;
            }
        }

        res.json({ reply: assistantReply });

    } catch (error) {
        console.error("ChatGPT API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: error.response ? error.response.data : "Unknown error" });
    }
});

// Start the server
app.listen(10000, () => console.log("✅ Server running on port 10000"));
