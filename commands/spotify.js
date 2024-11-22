const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage, api) {
    const query = args.join(' ');
    console.log(`Received Spotify request for query: "${query}"`);

    try {
      const apiUrl = `https://vneerapi.onrender.com/spotify2?song=${encodeURIComponent(query)}`;
      console.log(`Requesting API: ${apiUrl}`);
      const response = await axios.get(apiUrl);

      // Log the full API response for debugging
      console.log('API Response:', response.data);

      const {
        message,
        metadata: { name: trackName, artist: artistName, album, releaseDate, url: spotifyLink, cover_url: coverUrl },
        download: { download: { file_url: fileUrl } },
      } = response.data;

      console.log(`Parsed data: Track: ${trackName}, Artist: ${artistName}, File URL: ${fileUrl}, Cover URL: ${coverUrl}`);

      // Send the combined text and image as a generic template
      api.graph({
        recipient: {
          id: senderId
        },
        message: {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements: [
                {
                  title: trackName || 'Unknown Track', // Fallback if trackName is missing
                  subtitle: `🎤 Artist: ${artistName || 'Unknown Artist'}\n💿 Album: ${album || 'Unknown Album'}\n📅 Released: ${releaseDate || 'Unknown Date'}`,
                  image_url: coverUrl || 'https://via.placeholder.com/150', // Placeholder if coverUrl is missing
                  buttons: [
                    {
                      type: 'web_url',
                      url: fileUrl || spotifyLink || '#', // Fallback to Spotify link or nothing
                      title: fileUrl ? 'Download' : 'Listen on Spotify'
                    }
                  ]
                }
              ]
            }
          }
        }
      });
      console.log('Sent generic template with text and image.');

      // Send the audio file if available
      if (fileUrl) {
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: fileUrl,
              is_reusable: true
            }
          }
        }, pageAccessToken);
        console.log('Sent audio file.');
      } else {
        console.warn('No audio file URL available.');
      }

    } catch (error) {
      console.error('Error retrieving Spotify link or sending messages:', error.message);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
