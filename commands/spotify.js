const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
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

      // Send the text message
      sendMessage(senderId, {
        text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n💿 Album: ${album}\n📅 Release Date: ${releaseDate}\n🔗 Spotify: ${spotifyLink}`
      }, pageAccessToken);
      console.log('Sent text message.');

      // Send the image cover
      if (coverUrl) {
        sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: coverUrl,
              is_reusable: true
            }
          }
        }, pageAccessToken);
        console.log('Sent cover image.');
      } else {
        console.warn('No cover image URL available.');
      }

      // Send the audio file
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
