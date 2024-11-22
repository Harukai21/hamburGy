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
        message = 'No metadata found', // Fallback message
        metadata: {
          name: trackName = 'Unknown',
          artist: artistName = 'Unknown',
          album = 'Unknown',
          releaseDate = 'Unknown',
          url: spotifyLink = '#',
          cover_url: coverUrl = null
        } = {},
        download: {
          download: { file_url: fileUrl = null } = {}
        } = {}
      } = response.data;

      console.log(`Parsed data: Track: ${trackName}, Artist: ${artistName}, File URL: ${fileUrl}, Cover URL: ${coverUrl}`);

      // Send the text message
      const textMessage = `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n💿 Album: ${album}\n📅 Release Date: ${releaseDate}\n🔗 Spotify: ${spotifyLink}`;
      sendMessage(senderId, { text: textMessage }, pageAccessToken);
      console.log('Sent text message.');

      // Send the image and interactive buttons
      if (coverUrl || fileUrl) {
        const elements = [
          {
            title: trackName,
            subtitle: `Artist: ${artistName}\nAlbum: ${album}`,
            image_url: coverUrl || 'https://example.com/default-cover.jpg', // Fallback image
            buttons: [
              ...(fileUrl
                ? [{
                  type: 'web_url',
                  url: fileUrl,
                  title: 'Download'
                }]
                : []),
              ...(spotifyLink !== '#'
                ? [{
                  type: 'web_url',
                  url: spotifyLink,
                  title: 'Open in Spotify'
                }]
                : [])
            ]
          }
        ];

        sendMessage(senderId, {
          attachment: {
            type: 'template',
            payload: {
              template_type: 'generic',
              elements
            }
          }
        }, pageAccessToken);
        console.log('Sent interactive message with cover and buttons.');
      } else {
        console.warn('No cover image or file URL available.');
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
