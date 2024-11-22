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

      const {
        message = 'No metadata found',
        metadata: {
          name: trackName = 'Unknown',
          artist: artistName = 'Unknown',
          album = 'Unknown',
          releaseDate = 'Unknown',
          url: spotifyLink = '#',
          preview_url: previewUrl = null,
          cover_url: coverUrl = null
        } = {},
        download: {
          download: { 
            file_url: fileUrl = null
          } = {}
        } = {}
      } = response.data;

      console.log(`Parsed data: Track: ${trackName}, Artist: ${artistName}`);

      // Send the image and interactive buttons
      if (coverUrl || fileUrl) {
        const elements = [
          {
            title: trackName,
            subtitle: `Artist: ${artistName}\nAlbum: ${album}\nRelease Date: ${releaseDate}`,
            image_url: coverUrl || 'https://i.imgur.com/nGCJW9S.jpeg', // Fallback image
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

        await sendMessage(senderId, {
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

      // Retry logic for sending audio attachments
      const sendAudioWithRetry = async (audioUrl, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}: Sending audio...`);
            await sendMessage(senderId, {
              attachment: {
                type: 'audio',
                payload: { url: audioUrl, is_reusable: true }
              }
            }, pageAccessToken);
            console.log('Audio sent successfully.');
            return true; // Exit on success
          } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) {
              console.error('Max retry attempts reached.');
              return false; // Exit after final failure
            }
          }
        }
      };

      let audioSent = false;

      // Try sending `file_url` first
      if (fileUrl) {
        console.log('Trying to send file_url...');
        audioSent = await sendAudioWithRetry(fileUrl);
      }

      // If `file_url` fails, try `preview_url`
      if (!audioSent && previewUrl) {
        console.log('file_url failed. Trying preview_url...');
        audioSent = await sendAudioWithRetry(previewUrl);
      }

      // Fallback message if all audio attempts fail
      if (!audioSent) {
        console.warn('All audio sending attempts failed.');
        await sendMessage(senderId, { text: 'Sorry, we couldn’t send the audio file.' }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error retrieving Spotify link or sending messages:', error.message);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
