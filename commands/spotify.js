const axios = require('axios');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://vneerapi.onrender.com/spotify?song=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      // Extract song information from the response
      const message = response.data.message;
      const trackName = response.data.track;
      const artistName = response.data.artist;
      const spotifyLink = response.data.spotify_url;
      const audioBase64 = response.data.audio_base64;

      if (audioBase64) {
        // Send a message with the song's name, artist, and Spotify URL
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
        }, pageAccessToken);

        // Decode the base64 string to a binary buffer
        const audioBuffer = Buffer.from(audioBase64, 'base64');

        // Send the MP3 file as an attachment
        sendMessage(senderId, {
          attachment: {
            type: 'file',
            payload: {
              file: audioBuffer,
              filename: `${trackName} - ${artistName}.mp3`
            }
          }
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Sorry, no audio data found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving Spotify data:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
