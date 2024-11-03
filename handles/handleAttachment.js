const { execute: aiExecute } = require('../commands/ai'); // Import AI handler
const { sendMessage } = require('./sendMessage'); // Import sendMessage
const axios = require('axios');

async function setTypingIndicator(senderId, pageAccessToken, action = 'typing_on', retries = 3) {
  try {
    await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: { id: senderId },
      sender_action: action
    });
  } catch (error) {
    console.error(`Error setting typing indicator to ${action}:`, error);
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying ${action}... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await setTypingIndicator(senderId, pageAccessToken, action, retries - 1);
    }
  }
}

async function handleAttachment(event, PAGE_ACCESS_TOKEN) {
  const senderId = event.sender.id;
  const attachments = event.message.attachments;

  for (const attachment of attachments) {
    switch (attachment.type) {
      case 'image':
        const imageUrl = attachment.payload.url;
        console.log(`Image received: ${imageUrl}`);

        // Check if the URL contains the thumbs-up pattern and skip if it does
        if (imageUrl.includes("t39.1997-6")) {
          console.log("Thumbs-up emoji detected. Ignoring...");
          return;
        }

        // Turn on typing indicator
        await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_on');

        // Process the image with AI execute
        await aiExecute(
          senderId,
          `recognize_image:${imageUrl}`, // Pass image URL for recognition
          PAGE_ACCESS_TOKEN,
          sendMessage
        );

        // Turn off typing indicator
        await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_off');
        break;

      case 'video':
        console.log(`Video received: ${attachment.payload.url}`);
        break;

      case 'audio':
        console.log(`Audio received: ${attachment.payload.url}`);
        break;

      case 'file':
        console.log(`File received: ${attachment.payload.url}`);
        break;

      case 'location':
        const { lat, long } = attachment.payload.coordinates;
        console.log(`Location received: Latitude ${lat}, Longitude ${long}`);
        break;

      default:
        console.log(`Unknown attachment type received: ${attachment.type}`);
    }
  }
}
