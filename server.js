require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ASSISTANT_ID = "asst_1bzW6Cul4Ngrg1HtSEA2ZZQ9"; // Replace with your OpenAI Assistant ID
const OPENAI_API_URL = "https://api.openai.com/v1/threads";

// Route to interact with the AI Assistant
app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;

        // Step 1: Create a thread
        const threadResponse = await axios.post(
            OPENAI_API_URL,
            {},
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
        );
        const threadId = threadResponse.data.id;

        // Step 2: Send user's message to the assistant
        await axios.post(
            `${OPENAI_API_URL}/${threadId}/messages`,
            { role: "user", content: message },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
        );

        // Step 3: Run the assistant
        const runResponse = await axios.post(
            `${OPENAI_API_URL}/${threadId}/runs`,
            { assistant_id: ASSISTANT_ID },
            { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
        );

        const runId = runResponse.data.id;

        // Step 4: Wait for the assistant's response
        let completed = false;
        let assistantReply = "";

        while (!completed) {
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for 2 seconds before checking

            const checkStatus = await axios.get(
                `${OPENAI_API_URL}/${threadId}/runs/${runId}`,
                { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
            );

            if (checkStatus.data.status === "completed") {
                const messagesResponse = await axios.get(
                    `${OPENAI_API_URL}/${threadId}/messages`,
                    { headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" } }
                );

                assistantReply = messagesResponse.data.data[0].content[0].text.value;
                completed = true;
            }
        }

        res.json({ reply: assistantReply });
    } catch (error) {
        console.error("ChatGPT API Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

// Start the server
app.listen(10000, () => console.log("✅ Server running on port 10000"));