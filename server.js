require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());
app.use(cors());

// 1) Your OpenAI config
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const HEADERS = {
  Authorization: `Bearer ${OPENAI_API_KEY}`,
  "Content-Type": "application/json",
};

// 2) Your existing link functions (unchanged)
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

// 3) Define the function schemas so GPT knows these functions exist
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

// 4) The /chat endpoint (multi-turn + function calling)
app.post("/chat", async (req, res) => {
  try {
    // We expect an array of messages from the client:
    // e.g. [
    //   { role: "system", content: "..." },
    //   { role: "user", content: "How can I contact Bharath?" },
    //   { role: "assistant", content: "...some text..." },
    //   { role: "user", content: "Yes, I'd like to see his resume." }
    // ]
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res
        .status(400)
        .json({ error: "You must send a 'messages' array in the request body." });
    }

    // 🏆 TIP: Insert or update the first system message if needed
    // If your front-end does NOT provide a system message, we can prepend one:
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

    // If the messages array does NOT already have a system message, we can push one:
    const hasSystem = messages.some((m) => m.role === "system");
    if (!hasSystem) {
      messages.unshift(detailedSystemInstruction);
    }

    // 5) Make the request to OpenAI with function_call: "auto"
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

    // Extract the assistant's new message
    const assistantMessage = response.data.choices[0].message;
    let assistantReply = assistantMessage.content || "";

    // If GPT calls a function, handle it
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

    // Send the final text (or link) back
    res.json({ reply: assistantReply });
  } catch (error) {
    console.error("ChatGPT API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || "Unknown error occurred",
    });
  }
});

// 6) Start Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
