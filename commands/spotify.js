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

      const { track: trackName, artist: artistName, spotify_url: spotifyLink, download_link: downloadLink } = response.data;

      if (downloadLink) {
        // Validate the downloadLink
        const isUrlValid = await axios
          .head(downloadLink)
          .then(() => true)
          .catch(() => false);

        if (!isUrlValid) {
          sendMessage(senderId, { text: 'Sorry, the download link is not accessible.' }, pageAccessToken);
          return;
        }

        // Upload the file to Facebook as an attachment
        const attachmentUploadUrl = `https://graph.facebook.com/v20.0/me/message_attachments?access_token=${pageAccessToken}`;
        const attachmentPayload = {
          message: {
            attachment: {
              type: 'audio',
              payload: {
                url: downloadLink,
                is_reusable: true,
              },
            },
          },
        };

        const attachmentResponse = await axios.post(attachmentUploadUrl, attachmentPayload);
        const attachmentId = attachmentResponse.data.attachment_id;

        // Send the uploaded attachment as a message
        await sendMessage(
          senderId,
          {
            attachment: {
              type: 'audio',
              payload: {
                attachment_id: attachmentId,
              },
            },
          },
          pageAccessToken
        );

        // Send additional information
        await sendMessage(
          senderId,
          {
            text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`,
          },
          pageAccessToken
        );
      } else {
        sendMessage(senderId, { text: 'Sorry, no download link found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error sending audio attachment:', error.response ? error.response.data : error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  },
};
