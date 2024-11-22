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
            file_url: fileUrl = null,
            audio_base64: audioBase64 = null 
          } = {}
        } = {}
      } = response.data;

      console.log(`Parsed data: Track: ${trackName}, Artist: ${artistName}, File URL: ${fileUrl}, Preview URL: ${previewUrl}, Audio Base64: ${audioBase64}`);

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
      const sendAudioWithRetry = async (url, isBase64 = false, maxRetries = 3) => {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Attempt ${attempt}: Sending audio (${isBase64 ? 'Base64' : 'URL'})...`);
            const payload = isBase64
              ? { audio_base64: url, is_reusable: true }
              : { url, is_reusable: true };

            await sendMessage(senderId, {
              attachment: {
                type: 'audio',
                payload
              }
            }, pageAccessToken);

            console.log('Audio sent successfully.');
            return true; // Exit on success
          } catch (error) {
            console.error(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === maxRetries) {
              console.warn('Max retries reached. Moving to the next fallback.');
            }
          }
        }
        return false; // Indicate failure after retries
      };

      // Attempt to send audio with fallbacks
      let audioSent = false;

      if (fileUrl) {
        audioSent = await sendAudioWithRetry(fileUrl);
      }

      if (!audioSent && audioBase64) {
        console.log('File URL failed. Attempting to send audio_base64...');
        audioSent = await sendAudioWithRetry(audioBase64, true);
      }

      if (!audioSent && previewUrl) {
        console.log('Audio Base64 failed. Attempting to send preview_url...');
        audioSent = await sendAudioWithRetry(previewUrl);
      }

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
