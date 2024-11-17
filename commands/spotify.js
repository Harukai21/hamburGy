const axios = require('axios');
const fs = require('fs');
const path = require('path');
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

      // Extract song information
      const { track, artist, spotify_url, download_link } = response.data;

      if (download_link) {
        sendMessage(senderId, {
          text: `🎵 Song: ${track}\n🎤 Artist: ${artist}\n🔗 Spotify: ${spotify_url}`
        }, pageAccessToken);

        // Step 1: Download the file
        const tempFilePath = path.resolve(__dirname, 'temp_audio');
        const mp3FilePath = `${tempFilePath}.mp3`;

        const fileResponse = await axios.get(download_link, { responseType: 'arraybuffer' });
        fs.writeFileSync(tempFilePath, fileResponse.data);

        // Validate the downloaded file
        const fileStats = fs.statSync(tempFilePath);
        if (fileStats.size === 0) {
          throw new Error('Downloaded file is empty.');
        }

        // Step 2: Convert the file to MP3 using FFmpeg
        await new Promise((resolve, reject) => {
          exec(`ffmpeg -y -i "${tempFilePath}" -vn -ar 44100 -ac 2 -b:a 192k "${mp3FilePath}"`, (err, stdout, stderr) => {
            if (err) {
              console.error('FFmpeg error:', stderr);
              return reject(new Error('Failed to convert audio to MP3 format.'));
            }
            resolve();
          });
        });

        // Step 3: Send the MP3 file
        const facebookUploadUrl = `https://graph.facebook.com/v17.0/me/messages?access_token=${pageAccessToken}`;
        const formData = new FormData();
        formData.append('filedata', fs.createReadStream(mp3FilePath));

        const facebookResponse = await axios.post(facebookUploadUrl, formData, {
          headers: formData.getHeaders()
        });

        if (facebookResponse.data.attachment_id) {
          sendMessage(senderId, {
            attachment: {
              type: 'audio',
              payload: {
                attachment_id: facebookResponse.data.attachment_id,
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
