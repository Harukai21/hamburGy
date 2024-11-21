const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://vneerapi.onrender.com/spotify2?song=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      // Extract song information from the response
      const message = response.data.message;
      const trackName = response.data.metadata.name;
      const artistName = response.data.metadata.artist;
      const spotifyLink = response.data.metadata.url;
      const coverUrl = response.data.metadata.cover_url;
      const fileUrl = response.data.download.file_url;

      if (fileUrl) {
        // Step 1: Send the text message
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}\n🔗 Download: ${fileUrl}`
        }, pageAccessToken);

        // Step 2: Send the cover image
        sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: coverUrl, // Send the cover image URL
              is_reusable: true
            }
          }
        }, pageAccessToken);

        // Step 3: Send the audio file
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: fileUrl, // Send file_url as the audio attachment
              is_reusable: true
            }
          }
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Sorry, no audio file found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving Spotify link:', error);

      // Inform the user about the error
      sendMessage(senderId, {
        text: 'Sorry, there was an error processing your request. Please try again later.'
      }, pageAccessToken);
    }
  }
};
