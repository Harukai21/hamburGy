// handleAttachment.js

const { execute: aiExecute } = require('../commands/ai'); // Import AI handler
const { execute: gptExecute, isGptMode } = require('../commands/gpt'); // Import GPT handler and mode check
const { sendMessage } = require('./sendMessage'); // Import sendMessage

function handleAttachment(event, PAGE_ACCESS_TOKEN) {
  const senderId = event.sender.id;
  const attachments = event.message.attachments;

  attachments.forEach(async (attachment) => {
    switch (attachment.type) {
      case 'image':
        console.log(`Image received: ${attachment.payload.url}`);

        if (isGptMode()) {
          // Use GPT's image recognition if GPT mode is on
          await gptExecute(
            senderId,
            [`recognize_image:${attachment.payload.url}`], // Format image recognition request
            PAGE_ACCESS_TOKEN,
            sendMessage
          );
        } else {
          // Use AI's image handling if GPT mode is off
          await aiExecute(
            senderId,
            null, // No text message
            PAGE_ACCESS_TOKEN,
            sendMessage,
            'image', // Message type is 'image'
            attachment // Pass the attachment to AI
          );
        }
        break;

      case 'video':
        console.log(`Video received: ${attachment.payload.url}`);
        // Handle video attachments if necessary
        break;

      case 'audio':
        console.log(`Audio received: ${attachment.payload.url}`);
        // Handle audio attachments if necessary
        break;

      case 'file':
        console.log(`File received: ${attachment.payload.url}`);
        // Handle file attachments if necessary
        break;

      case 'location':
        const { lat, long } = attachment.payload.coordinates;
        console.log(`Location received: Latitude ${lat}, Longitude ${long}`);
        // Handle location attachments if necessary
        break;

      default:
        console.log(`Unknown attachment type received: ${attachment.type}`);
    }
  });
}

module.exports = { handleAttachment };
