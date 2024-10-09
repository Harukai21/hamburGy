const { G4F } = require("g4f");
const Groq = require('groq-sdk');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const axios = require('axios');
const fs = require('fs');

// Initialize the APIs
const g4f = new G4F();
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
      console.log("User's Message:", messageText || '[Attachment received]');
      
      // Indicate that the bot is processing the request
      sendMessage(senderId, { text: '' }, pageAccessToken);

      // Initialize user history if not present
      let userHistory = messageHistory.get(senderId) || [];
      if (userHistory.length === 0) {
        userHistory.push({ role: 'system', content: 'You are a helpful and kind assistant that answers everything.' });
      }

      let responseMessage = '';

      if (messageType === 'image' && attachment) {
        // Log that image processing is being called
        console.log("Calling Gemini image processing...");

        // Handle image input using the image URL with Gemini
        responseMessage = await handleImageWithGemini(attachment.payload.url);

        // Log the response from Gemini
        console.log("Gemini Response:", responseMessage);
      } else if (messageType === 'text' && messageText) {
        // Handle text input using G4F API
        userHistory.push({ role: 'user', content: messageText });
        responseMessage = await getG4FResponse(userHistory);

        // Fallback to Groq if G4F fails
        if (!responseMessage) {
          responseMessage = await getGroqResponse(userHistory);
        }
      } else {
        responseMessage = "Sorry, I couldn't process your request. Please send a valid message or image.";
      }

      // Append the assistant's response to the history
      userHistory.push({ role: 'assistant', content: responseMessage });

      // Update the message history for the user
      messageHistory.set(senderId, userHistory);

      // Send the response message in chunks if it exceeds the limit
      sendTwoChunksIfNecessary(senderId, responseMessage, pageAccessToken, sendMessage);

    } catch (error) {
      console.error('Error processing the request:', error.message);
      sendMessage(senderId, { text: "I'm busy right now, please try again later." }, pageAccessToken);
    }
  }
};

// Function to handle image input using Gemini (Google Generative AI)
async function handleImageWithGemini(imageUrl) {
  try {
    // Download the image from the provided URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    
    // Prepare the image for the Gemini model
    const image = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: response.headers['content-type'],
      },
    };

    console.log("Image data prepared for Gemini.");

    // Use the GenerateGeminiAnswer function to process the image
    const result = await GenerateGeminiAnswer([], image);

    // Log the full result for debugging purposes
    console.log("Full Gemini result:", result);

    // Check if the result has a valid text function and call it to get the actual text
    if (result?.response?.text) {
      const generatedText = await result.response.text();
      return generatedText || "No description was generated.";
    } else {
      // Log if the structure is not as expected
      console.error('Gemini response does not contain valid text:', result.response);
      return "Sorry, I couldn't analyze the image. Please try again.";
    }
  } catch (error) {
    console.error('Error handling image with Gemini:', error.message);
    return "Sorry, I couldn't analyze the image. Please try again.";
  }
}

// Function to get a response from the G4F API using a simple call
async function getG4FResponse(userHistory) {
  try {
    const response = await g4f.chatCompletion(userHistory);
    return response;
  } catch (error) {
    console.error('Error communicating with G4F:', error.message);
    return null; // Return null to indicate failure and trigger fallback
  }
}

// Function to get a response from the Groq API as fallback
async function getGroqResponse(userHistory) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: userHistory,
      model: 'llama3-8b-8192',
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    // Collect the response message from the stream
    let responseMessage = '';
    for await (const chunk of chatCompletion) {
      responseMessage += (chunk.choices[0]?.delta?.content || '');
    }
    return responseMessage;
  } catch (error) {
    console.error('Error communicating with Groq:', error.message);
    return null; // If both APIs fail, return null
  }
}

// Function to handle image input using Gemini (Google Generative AI)
async function handleImageWithGemini(imageUrl) {
  try {
    // Download the image from the provided URL
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    
    // Prepare the image for the Gemini model
    const image = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: response.headers['content-type'],
      },
    };

    console.log("Image data prepared for Gemini.");

    // Use the GenerateGeminiAnswer function to process the image
    const result = await GenerateGeminiAnswer([], image);

    // Log the full result for debugging purposes
    console.log("Full Gemini result:", result);

    // Ensure result structure is valid and contains text
    if (result) {
      return result;  // Return the processed response directly
    } else {
      console.error('Gemini response does not contain valid text:', result);
      return "Sorry, I couldn't analyze the image. Please try again.";
    }
  } catch (error) {
    console.error('Error handling image with Gemini:', error.message);
    return "Sorry, I couldn't analyze the image. Please try again.";
  }
}

// Updated function to generate a response from the Gemini model with safety settings
async function GenerateGeminiAnswer(history, files) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const generationConfig = {
    temperature: 0.9,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
  };

  const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  ];

  try {
    // Send the image and prompt to the Gemini model
    const prompt = "Describe this image.";
    const result = await model.generateContent([prompt, files], generationConfig, { safetySettings });

    // Log the generated result
    console.log("Generated Gemini content:", result);

    // Ensure we have valid text in the response
    if (result?.response?.text) {
      const generatedText = await result.response.text();
      return generatedText;
    } else {
      return "No description was generated.";
    }
  } catch (error) {
    console.error("Error generating Gemini answer:", error.message);
    return "Sorry, there was an error processing the image.";
  }
}
