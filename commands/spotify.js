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

      const trackName = response.data.track;
      const artistName = response.data.artist;
      const spotifyLink = response.data.spotify_url;
      const downloadLink = response.data.download_link;

      if (downloadLink) {
        // Upload the file to Facebook as an attachment
        const attachmentUploadUrl = `https://graph.facebook.com/v20.0/me/message_attachments?access_token=${pageAccessToken}`;
        const attachmentResponse = await axios.post(attachmentUploadUrl, {
          message: {
            attachment: {
              type: 'audio',
              payload: {
                url: downloadLink,
                is_reusable: true,
              },
            },
          },
        });

        const attachmentId = attachmentResponse.data.attachment_id;

        // Send the uploaded attachment as a message
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              attachment_id: attachmentId,
            },
          },
        }, pageAccessToken);
        
        // Send additional information
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
        }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: 'Sorry, no download link found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error sending audio attachment:', error.response ? error.response.data : error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
