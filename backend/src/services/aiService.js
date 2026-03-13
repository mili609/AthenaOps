// ============================================================
// aiService.js - OpenAI API integration
// ============================================================
// Sends prompts to the OpenAI API and returns text responses.
// You can swap this out for any other AI provider (Anthropic, etc.)

const OpenAI = require("openai");

// Lazy-initialise the OpenAI client so the app won't crash on startup
// if the key hasn't been set yet during development.
let openaiClient = null;

function getClient() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not set. Add it to your .env file."
      );
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

/**
 * Sends a prompt to the AI and returns the response text.
 * @param {string} systemPrompt - Instructions that define the AI's role
 * @param {string} userPrompt  - The actual question / task
 * @returns {Promise<string>}  - The AI's text response
 */
async function askAI(systemPrompt, userPrompt) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || "gpt-3.5-turbo";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3, // Lower temperature = more deterministic / consistent output
    max_tokens: 2000,
  });

  return completion.choices[0].message.content;
}

module.exports = { askAI };
