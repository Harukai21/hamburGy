const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Get a Spotify link for a song',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://spotifydl-api-54n8.onrender.com/spotifydl?search=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      const spotifyLink = response.data.track.downloadLink;

      if (spotifyLink) {
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: spotifyLink,
              is_reusable: true
            }
          }
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Sorry, no Spotify link found for that query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving Spotify link:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
