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

// ✅ Personal Links (Functions)
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

// ✅ OpenAI Function Schemas
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

// ✅ Chat Endpoint - Handles Function Calls
app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "You must send a 'messages' array in the request body." });
    }

    const detailedSystemInstruction = {
      role: "system",
      content: `
You are Bharath's helpful assistant with access to the following functions:
- book_call
- get_portfolio
- get_email
- get_linkedin
- get_resume

Detailed instructions:
1. If the user requests anything about booking a call, obtaining contact details, a resume, or portfolio, 
   you MUST call the relevant function (e.g., get_portfolio) instead of just mentioning it.
2. If the user says "Yes" or "Sure" after you offered a function, assume they want you to call that function.
3. Do NOT list the function names in your text response. If you call a function, do it silently and return the function result as normal text or links.
4. For all other questions or small talk not covered by these functions, respond in normal text.
5. Remember to keep context from previous messages in mind. If they said "yes" regarding a function you offered, 
   proceed with calling that function. Avoid re-confirming or re-asking the same question.
`,
    };

    const hasSystem = messages.some((m) => m.role === "system");
    if (!hasSystem) {
      messages.unshift(detailedSystemInstruction);
    }

    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: "gpt-3.5-turbo",
        messages: messages,
        functions: OPENAI_FUNCTIONS,
        function_call: "auto",
      },
      { headers: HEADERS }
    );

    const assistantMessage = response.data.choices[0].message;
    let assistantReply = assistantMessage.content || "";

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
          assistantReply = "I'm not sure which function to call. Sorry!";
      }
    }

    res.json({ reply: assistantReply });
  } catch (error) {
    console.error("ChatGPT API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || "Unknown error occurred",
    });
  }
});

// ✅ Webhook Endpoint - Handles Cal.com Booking Events
app.post("/webhook/call-booked", async (req, res) => {
  try {
    const secret = process.env.WEBHOOK_SECRET; // Use your secret from Cal.com
    const signature = req.headers["x-cal-signature"]; // Signature from Cal.com
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!signature || signature !== secret) {
      console.log("Invalid signature. Webhook rejected.");
      return res.status(401).send("Unauthorized");
    }

    // Process booking event
    const bookingData = req.body;
    console.log("✅ New Booking Received:", bookingData);

    // Extract key information
    const { name, email, startTime, eventType } = bookingData;

    // Example: Send a response message
    const responseMessage = `Booking confirmed for ${name} (${email}) on ${startTime}. Event type: ${eventType}`;

    res.status(200).send(responseMessage);
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
