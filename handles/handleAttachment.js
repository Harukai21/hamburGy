const { execute } = require('../ai'); // Import AI handler
const { sendMessage } = require('../sendMessage'); // Import your custom sendMessage function

function handleAttachment(event, PAGE_ACCESS_TOKEN) {
  const senderId = event.sender.id;
  const attachments = event.message.attachments;

  attachments.forEach(attachment => {
    switch (attachment.type) {
      case 'image':
        console.log(`Image received: ${attachment.payload.url}`);
        
        // Call AI to handle the image attachment
        execute(
          senderId, 
          null, // No text message
          PAGE_ACCESS_TOKEN, 
          sendMessage, // Use your custom sendMessage
          'image', // Message type is 'image'
          attachment // Pass the attachment to the AI
        );
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
