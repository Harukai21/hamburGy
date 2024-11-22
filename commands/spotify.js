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

      // Send the image and interactive buttons
      if (coverUrl || fileUrl) {
        const elements = [
          {
            title: trackName,
            subtitle: `Artist: ${artistName}\nAlbum: ${album}\n Release Date: ${releaseDate}`,
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

      // Retry logic for sending the audio file
      const sendAudioWithRetry = async (retryCount = 3) => {
        for (let attempt = 1; attempt <= retryCount; attempt++) {
          try {
            if (fileUrl) {
              console.log(`Attempt ${attempt}: Sending audio file...`);
              await sendMessage(senderId, {
                attachment: {
                  type: 'audio',
                  payload: {
                    url: fileUrl,
                    is_reusable: true
                  }
                }
              }, pageAccessToken);
              console.log('Audio file sent successfully.');
              return; // Exit the function if successful
            } else {
              console.warn('No audio file URL available.');
              break;
            }
          } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error.message);
            if (attempt === retryCount) {
              throw new Error('All retry attempts failed.');
            }
          }
        }
      };

      await sendAudioWithRetry();

    } catch (error) {
      console.error('Error retrieving Spotify link or sending messages:', error.message);
      await sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
