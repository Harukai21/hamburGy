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

async function handleAttachment(event, PAGE_ACCESS_TOKEN, command = "default") {
  const senderId = event.sender.id;
  const attachments = event.message.attachments;

  const imageUrls = [];

  for (const attachment of attachments) {
    switch (attachment.type) {
      case 'image':
        const imageUrl = attachment.payload.url;
        console.log(`Image received: ${imageUrl}`);

        // Check if the image URL contains "t39.1997-6" (indicating a thumbs-up emoji)
        if (imageUrl.includes('t39.1997-6')) {
          console.log('Thumbs-up emoji detected, ignoring image.');
          break; // Skip processing this image
        }

        imageUrls.push(imageUrl);
        break;

      case 'video':
        console.log(`Video received: ${attachment.payload.url}`);
        break;

      case 'audio':
        console.log(`Audio received: ${attachment.payload.url}`);
        break;

      case 'file':
        const fileUrl = attachment.payload.url;
        console.log(`File received: ${fileUrl}`);

        // Turn on typing indicator
        await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_on');

        // Process the document file with AI (or another handler if separate)
        await aiExecute(
          senderId,
          `process_file:${fileUrl}`, // Pass file URL for processing
          PAGE_ACCESS_TOKEN,
          sendMessage
        );

        // Turn off typing indicator
        await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_off');
        break;

      case 'location':
        const { lat, long } = attachment.payload.coordinates;
        console.log(`Location received: Latitude ${lat}, Longitude ${long}`);
        break;

      default:
        console.log(`Unknown attachment type received: ${attachment.type}`);
    }
  }

  // If there are multiple images, handle them as a batch
  if (imageUrls.length > 0) {
    // Turn on typing indicator
    await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_on');

    // Process all images together, adjusting for different commands if necessary
    await aiExecute(
      senderId,
      `recognize_images:${JSON.stringify(imageUrls)}`, // Pass multiple image URLs
      PAGE_ACCESS_TOKEN,
      sendMessage,
      command // Pass command for specific handling if needed
    );

    // Turn off typing indicator
    await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_off');
  }
}

module.exports = { handleAttachment };
