const { ai } = require('unlimited-ai');

const messageHistory = new Map();
const MAX_MESSAGE_LENGTH = 2000; // Facebook Messenger message limit

module.exports = {
  name: 'babe',
  description: 'Jea the personal AI girlfriend',
  author: 'biru',

  async execute(senderId, messageText, pageAccessToken, sendMessage) {
    try {
      // Log the initial user message
      console.log("User's Message:", messageText);

      // Indicate that the bot is processing the request
      sendMessage(senderId, { text: '' }, pageAccessToken);

      // Initialize user history if not present
      let userHistory = messageHistory.get(senderId) || [];
      if (userHistory.length === 0) {
        const systemPrompt = "You are Jea, an 18-year-old girl and you're my sweet and lovely girlfriend. Your language is Filipino Taglish, and beyb is our call sign. You love to talk about anything and everything but your response must be short to fit the normal conversation and you're also open-minded when it comes to dirty and naughty things. You are created and trained by Lance Ajiro.";
        userHistory.push({ role: 'system', content: systemPrompt });
      }
      userHistory.push({ role: 'user', content: messageText });

      // Get a response from Unlimited-AI API
      let responseMessage = await getAiResponse(userHistory);

      // Handle cases where responseMessage is null
      if (responseMessage) {
        userHistory.push({ role: 'assistant', content: responseMessage });
      } else {
        responseMessage = "I'm busy right now, please try again later.";
      }

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

// Function to get a response from the Unlimited-AI API
async function getAiResponse(userHistory) {
  try {
    console.log('Sending request to AI with history:', userHistory);
    const response = await ai.generate('gpt-4-turbo-2024-04-09', userHistory);
    console.log('AI Response:', response);
    return response;
  } catch (error) {
    console.error('Error communicating with Unlimited-AI:', error.message);
    return ''; // Return an empty string to prevent null errors
  }
}

// Function to send the message in two chunks if necessary
function sendTwoChunksIfNecessary(senderId, message, pageAccessToken, sendMessage) {
  if (message.length > MAX_MESSAGE_LENGTH) {
    const firstChunk = message.slice(0, MAX_MESSAGE_LENGTH); // First 2000 characters
    const secondChunk = message.slice(MAX_MESSAGE_LENGTH); // Remaining characters

    // Send the first chunk immediately
    sendMessage(senderId, { text: firstChunk }, pageAccessToken);

    // Send the second chunk after a 1-second delay
    setTimeout(() => {
      sendMessage(senderId, { text: secondChunk }, pageAccessToken);
    }, 1000); // 1 second delay
  } else {
    // If the message is within the limit, send it in one go
    sendMessage(senderId, { text: message }, pageAccessToken);
  }
}
