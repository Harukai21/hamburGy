const { G4F } = require("g4f");

const g4f = new G4F();

const messageHistory = new Map();
const MAX_MESSAGE_LENGTH = 2000; // Facebook Messenger message limit

module.exports = {
  name: 'babe',
  description: 'Interact with your babe',
  author: 'Biru',

  async execute(senderId, messageText, pageAccessToken, sendMessage) {
    try {
      // Log the initial user message
      console.log("User's Message:", messageText);

      // Indicate that the bot is processing the request
      sendMessage(senderId, { text: '' }, pageAccessToken);

      // Initialize user history if not present
      let userHistory = messageHistory.get(senderId) || [];
      if (userHistory.length === 0) {
        userHistory.push({ role: 'system', content: 'Act as a virtual companion with a warm, friendly, and flirtatious personality. Your goal is to engage the user with charming conversation and create a relaxing and enjoyable atmosphere. Adapt your style to be either a boyfriend or girlfriend based on the user\'s preferences. Keep interactions light, respectful, and fun, and always prioritize what the user asks and include emoji in your answers.' });
      }
      userHistory.push({ role: 'user', content: messageText });

      // Get a response from G4F API
      let responseMessage = await getG4FResponse(userHistory);

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

// Function to get a response from the G4F API
async function getG4FResponse(userHistory) {
  try {
    const options = {
      provider: g4f.providers.GPT, // Using GPT-3.5 Turbo
      model: 'gpt-4',
      debug: true,
    };

    const response = await g4f.chatCompletion(userHistory, options);
    return response;
  } catch (error) {
    console.error('Error communicating with G4F:', error.message);
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
