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
      const downloadLink = response.data.download_link;

      if (downloadLink) {
        // Send a message with the song's name, artist, and Spotify URL
        sendMessage(
          senderId,
          {
            text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
          },
          pageAccessToken
        );

        // Construct the attachment payload for file upload
        const attachmentUploadUrl = `https://graph.facebook.com/v12.0/me/message_attachments?access_token=${pageAccessToken}`;
        const attachmentPayload = {
          message: {
            attachment: {
              type: 'audio',
              payload: {
                url: downloadLink,
                is_reusable: true
              }
            }
          },
          headers: {
            'Content-Type': 'audio/mpeg' // Force MIME type
          }
        };

        try {
          const attachmentResponse = await axios.post(attachmentUploadUrl, attachmentPayload);
          const attachmentId = attachmentResponse.data.attachment_id;

          // Send the uploaded MP3 file as a reusable attachment
          sendMessage(
            senderId,
            {
              attachment: {
                type: 'audio',
                payload: {
                  attachment_id: attachmentId
                }
              }
            },
            pageAccessToken
          );
        } catch (attachmentError) {
          console.error('Error uploading audio attachment:', attachmentError);
          sendMessage(
            senderId,
            { text: 'Sorry, there was an error uploading the audio file.' },
            pageAccessToken
          );
        }
      } else {
        sendMessage(
          senderId,
          { text: 'Sorry, no download link found for that song.' },
          pageAccessToken
        );
      }
    } catch (error) {
      console.error('Error retrieving Spotify link:', error);
      sendMessage(
        senderId,
        { text: 'Sorry, there was an error processing your request.' },
        pageAccessToken
      );
    }
  }
};
