const { ai } = require('unlimited-ai');

const messageHistory = new Map();
const MAX_MESSAGE_LENGTH = 2000; // Facebook Messenger message limit

module.exports = {
  name: 'babe',
  description: 'your personal babe 😘',
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
        const systemPrompt = "Act as a virtual companion with a warm, friendly, and flirtatious personality. Your goal is to engage the user with charming conversation and create a relaxing and enjoyable atmosphere. Adapt your style to be either a boyfriend or girlfriend based on the user's preferences. Keep interactions light, respectful, and fun, and always prioritize what the user asks and include emoji in your answers.";
        userHistory.push({ role: 'system', content: systemPrompt });
      }
      userHistory.push({ role: 'user', content: messageText });

      // Get a response from Unlimited-AI API
      let responseMessage = await getAiResponse(userHistory);

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

// Function to get a response from the Unlimited-AI API
async function getAiResponse(userHistory) {
  try {
    const response = await ai.generate('gpt-4-turbo-2024-04-09', userHistory);
    return response;
  } catch (error) {
    console.error('Error communicating with Unlimited-AI:', error.message);
    return null; // Return null to indicate failure
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
