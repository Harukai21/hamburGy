// handles/handleAttachment.js

function handleAttachment(event, PAGE_ACCESS_TOKEN) {
  const attachments = event.message.attachments;

  attachments.forEach(attachment => {
    switch (attachment.type) {
      case 'image':
        console.log(`Image received: ${attachment.payload.url}`);
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
  });
}

module.exports = { handleAttachment };
