const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const FormData = require('form-data');

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

      // Extract song information
      const message = response.data.message;
      const trackName = response.data.track;
      const artistName = response.data.artist;
      const spotifyLink = response.data.spotify_url;
      const audioBase64 = response.data.audio_base64;

      if (audioBase64) {
        // Convert base64 to a binary file
        const tempFile = path.resolve(__dirname, `${trackName}-${artistName}.bin`);
        const outputFile = path.resolve(__dirname, `${trackName}-${artistName}.mp3`);

        fs.writeFileSync(tempFile, audioBase64, { encoding: 'base64' });

        // Convert binary file to MP3 using ffmpeg
        await new Promise((resolve, reject) => {
          exec(
            `ffmpeg -y -i ${tempFile} -codec:a libmp3lame -qscale:a 2 ${outputFile}`,
            (error, stdout, stderr) => {
              if (error) {
                console.error('Error converting audio:', stderr);
                reject(error);
              } else {
                console.log('Audio converted successfully.');
                resolve();
              }
            }
          );
        });

        // Prepare form-data for the Facebook attachment upload API
        const formData = new FormData();
        formData.append('filedata', fs.createReadStream(outputFile));

        // Upload MP3 to Facebook
        const uploadResponse = await axios.post(
          `https://graph.facebook.com/v21.0/me/message_attachments`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              Authorization: `Bearer ${pageAccessToken}`,
            },
          }
        );

        const attachmentId = uploadResponse.data.attachment_id;

        // Send a message with the song's name, artist, and Spotify URL
        sendMessage(senderId, {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
        }, pageAccessToken);

        // Send the MP3 file as an attachment
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              attachment_id: attachmentId
            }
          }
        }, pageAccessToken);

        // Cleanup temporary files
        fs.unlinkSync(tempFile);
        fs.unlinkSync(outputFile);
      } else {
        sendMessage(senderId, { text: 'Sorry, no audio data found for that song.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error processing Spotify data:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
