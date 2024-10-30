const { execute: aiExecute } = require('../commands/ai'); // Import AI handler
const { sendMessage } = require('./sendMessage'); // Import sendMessage

async function handleAttachment(event, PAGE_ACCESS_TOKEN) {
  const senderId = event.sender.id;
  const attachments = event.message.attachments;

  for (const attachment of attachments) {
    switch (attachment.type) {
      case 'image':
        console.log(`Image received: ${attachment.payload.url}`);

        // Directly process the image with AI execute
        await aiExecute(
          senderId,
          `recognize_image:${attachment.payload.url}`, // Pass image URL for recognition
          PAGE_ACCESS_TOKEN,
          sendMessage
        );
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

module.exports = { handleAttachment };
