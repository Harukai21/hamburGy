const { execute: aiExecute, userState } = require('../commands/ai'); // Import AI handler and userState
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

        await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_on');

        userState[senderId] = { waitingForFilePrompt: true, fileUrl };
        await sendMessage(senderId, { text: 'Please provide a prompt to process the file.' }, PAGE_ACCESS_TOKEN);

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

  if (imageUrls.length > 0) {
    await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_on');

    userState[senderId] = { waitingForImagePrompt: true, imageUrls };
    await sendMessage(senderId, { text: 'Please provide a prompt to process the received image(s).' }, PAGE_ACCESS_TOKEN);

    await setTypingIndicator(senderId, PAGE_ACCESS_TOKEN, 'typing_off');
  }
}

module.exports = { handleAttachment };
