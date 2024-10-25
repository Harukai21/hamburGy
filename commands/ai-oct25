const { ai } = require('globalsprak');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');

// Initialize the APIs
const groq = new Groq({ apiKey: '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' });
const genAI = new GoogleGenerativeAI("AIzaSyBcyNtgDliBoVFvsHueC1NPBDCucznkwUk");
const messageHistory = new Map();
const MAX_MESSAGE_LENGTH = 2000; // Facebook Messenger message limit

module.exports = {
  name: 'ai',
  description: 'Listens to any incoming messages',
  usage: 'just put a message',
  author: 'Biru',

  async execute(senderId, messageText, pageAccessToken, sendMessage, messageType = 'text', attachment = null) {
    try {
      // Indicate that the bot is processing the request
      sendMessage(senderId, { text: '' }, pageAccessToken);

      // Initialize user history if not present
      let userHistory = messageHistory.get(senderId) || [];
      if (userHistory.length === 0) {
        userHistory.push({ role: 'system', content: 'You are an assistant that answers everything.' });
      }

      let responseMessage = '';

      if (messageType === 'image' && attachment) {
        // Handle image input using the image URL with Gemini
        responseMessage = await handleImageWithGemini(attachment.payload.url);
      } else if (messageType === 'text' && messageText) {
        userHistory.push({ role: 'user', content: messageText });
        responseMessage = await getGlobalsprakResponse(userHistory);

        // Log the response from Globalsprak
        console.log("Globalsprak Response:", responseMessage);

        if (!responseMessage) {
          responseMessage = await getGroqResponse(userHistory);
          console.log("Fallback to Groq Response:", responseMessage);
        }
      } else {
        responseMessage = "Sorry, I couldn't process your request. Please send a valid message or image.";
      }

      // Append the assistant's response to the history
      userHistory.push({ role: 'assistant', content: responseMessage });
      messageHistory.set(senderId, userHistory);

      // Ensure the response is properly UTF-8 encoded and cleaned
      const cleanMessage = Buffer.from(responseMessage, 'utf-8').toString().replace(/[^\x00-\x7F]/g, '');

      // Send the response message in chunks if necessary
      sendTwoChunksIfNecessary(senderId, cleanMessage, pageAccessToken, sendMessage);

    } catch (error) {
      // Log the actual error
      console.error("Error in AI Execution:", error);

      // Automatically clear the user's message history on error
      clearHistory(senderId);

      // Notify the user that the history has been cleared to avoid further issues
      sendMessage(senderId, { text: "History cleared to avoid error. Please try again." }, pageAccessToken);
    }
  }
};

// Function to handle image input using Gemini (Google Generative AI)
async function handleImageWithGemini(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    
    const image = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: response.headers['content-type'],
      },
    };

    const result = await GenerateGeminiAnswer([], image);

    if (result?.response?.candidates && result.response.candidates[0]?.content?.parts[0]?.text) {
      return result.response.candidates[0].content.parts[0].text;
    } else {
      return "Sorry, I couldn't generate a description for the image.";
    }
  } catch (error) {
    console.error("Error in handleImageWithGemini:", error);
    return "Sorry, I couldn't analyze the image. Please try again.";
  }
}

// Function to get a response from the Globalsprak AI
async function getGlobalsprakResponse(userHistory) {
  try {
    const prompt = userHistory.map(entry => entry.content).join("\n");
    const model = "gpt-4o-2024-08-06"; // Use the desired model
    const response = await ai(prompt, model);

    // Ensure that we return the actual 'answer' field from the Globalsprak response
    if (response && response.status === 'success' && response.answer) {
      return response.answer; // Extract the answer from the response
    } else {
      return null; // Fallback in case there's no valid answer
    }
  } catch (error) {
    console.error("Globalsprak Error:", error); // Log the error for Globalsprak
    return null;
  }
}

// Function to get a response from the Groq API as fallback
async function getGroqResponse(userHistory) {
  try {
    // Validate and sanitize userHistory to ensure content is always a string
    const sanitizedHistory = userHistory.map(entry => {
      return {
        role: entry.role,
        content: typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content)
      };
    });

    const chatCompletion = await groq.chat.completions.create({
      messages: sanitizedHistory,
      model: 'llama-3.2-90b-vision-preview',
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    let responseMessage = '';
    for await (const chunk of chatCompletion) {
      responseMessage += (chunk.choices[0]?.delta?.content || '');
    }
    return responseMessage;
  } catch (error) {
    console.error("Groq Error:", error); // Log the error for Groq
    return null;
  }
}


// Function to send the message in two chunks if necessary
function sendTwoChunksIfNecessary(senderId, message, pageAccessToken, sendMessage) {
  if (message.length > MAX_MESSAGE_LENGTH) {
    const firstChunk = message.slice(0, MAX_MESSAGE_LENGTH);
    const secondChunk = message.slice(MAX_MESSAGE_LENGTH);

    sendMessage(senderId, { text: firstChunk }, pageAccessToken);

    setTimeout(() => {
      sendMessage(senderId, { text: secondChunk }, pageAccessToken);
    }, 1000);
  } else {
    sendMessage(senderId, { text: message }, pageAccessToken);
  }
}

// Simplified function to generate a response from Gemini model
async function GenerateGeminiAnswer(history, files) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const generationConfig = {
    temperature: 0.9,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  try {
    const prompt = "Describe the image. If there's a question, a math problem or an activity, then answer and solve it.";
    const result = await model.generateContent([prompt, files], generationConfig);

    return result;
  } catch (error) {
    console.error("Gemini Error:", error); // Log any errors for Gemini
    return null;
  }
}

// Automatically clear the user's message history
function clearHistory(senderId) {
  messageHistory.delete(senderId);
}
