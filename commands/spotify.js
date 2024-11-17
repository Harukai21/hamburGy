const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const { exec } = require('child_process');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify and sends it to Facebook.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');

    try {
      const apiUrl = `https://vneerapi.onrender.com/spotify?song=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      // Extract song information from the response
      const trackName = response.data.track;
      const artistName = response.data.artist;
      const spotifyLink = response.data.spotify_url;
      const downloadLink = response.data.download_link;

      if (downloadLink) {
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
        }, pageAccessToken);

        // Step 1: Download the file from downloadLink
        const tempFilePath = path.resolve(__dirname, 'temp_audio');
        const mp3FilePath = `${tempFilePath}.mp3`;

        const writer = fs.createWriteStream(tempFilePath);
        const downloadResponse = await axios.get(downloadLink, { responseType: 'stream' });
        downloadResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Step 2: Convert the file to MP3 using FFmpeg
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -i "${tempFilePath}" -vn -ar 44100 -ac 2 -b:a 192k "${mp3FilePath}"`, (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        // Step 3: Upload the MP3 file as an attachment using FormData
        const formData = new FormData();
        formData.append('filedata', fs.createReadStream(mp3FilePath));

        const facebookUploadUrl = `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`;
        const facebookResponse = await axios.post(facebookUploadUrl, formData, {
          headers: {
            ...formData.getHeaders()
          }
        });

        if (facebookResponse.data) {
          // Step 4: Send the attachment to the user
          sendMessage(senderId, {
            attachment: {
              type: 'audio',
              payload: {
                url: facebookResponse.data.attachment_id,
                is_reusable: true
              }
            }
          }, pageAccessToken);
        }

        // Clean up temporary files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(mp3FilePath);

      } else {
        sendMessage(senderId, { text: 'Sorry, no download link found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error:', error.message);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
