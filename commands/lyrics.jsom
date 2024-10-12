const { find } = require('llyrics');

module.exports = {
  name: 'lyrics',
  description: 'search for lyrics',
  usage: '/lyrics <SongTitle>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');
    
    try {
      // Call the llyrics package to find the song lyrics using Genius API
      const response = await find({
        song: query,
        engine: 'musixmatch',          // Using Genius as the engine
        geniusApiKey: 'TUoXsviG2F-cP3lzP5VtzZ3i1IjsPqHabEeqXq7LugC_1F7e0h6yZFrES7ihiaNc',
        forceSearch: true          // Enable retry with other engines if search fails
      });

      if (response && response.lyrics) {
        const lyricsMessage = `🎶 *${response.title}* by ${response.artist}\n\n${response.lyrics}`;

        // Split the lyrics message into chunks if it exceeds 2000 characters
        const maxMessageLength = 2000;
        if (lyricsMessage.length > maxMessageLength) {
          const messages = splitMessageIntoChunks(lyricsMessage, maxMessageLength);
          for (const message of messages) {
            sendMessage(senderId, { text: message }, pageAccessToken);
          }
        } else {
          sendMessage(senderId, { text: lyricsMessage }, pageAccessToken);
        }

        // Optionally send an image if available
        if (response.image) {
          // Handle any type of image URL
          sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: {
                url: response.image,   // URL provided from the response
                is_reusable: true      // Mark as reusable, if necessary
              }
            }
          }, pageAccessToken)
          .catch(err => {
            console.error('Error sending image:', err);
          });
        }
      } else {
        console.error('Error: No lyrics found in the response.');
        sendMessage(senderId, { text: 'Sorry, no lyrics were found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving lyrics:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
