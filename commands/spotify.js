const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: '/spotify <SongTitle>',
  usage: '/spotify',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://spotifydl-api-54n8.onrender.com/spotifydl?search=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      // Extract song information from the response
      const trackName = response.data.track.name;
      const artistName = response.data.track.artist;
      const spotifyLink = response.data.track.downloadLink;

      if (spotifyLink) {
        // Send a message with the song's name, artist, and MP3 file
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}`
        }, pageAccessToken);

        // Send the MP3 file as an attachment
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
