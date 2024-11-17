const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

module.exports = {
  name: 'spotify',
  description: 'Downloads music from Spotify and sends it as an attachment.',
  usage: '/spotify <title>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(' ');
    const tempDir = './temp'; // Temporary directory for file processing
    const outputFileName = `${Date.now()}.mp3`;
    const outputFilePath = path.join(tempDir, outputFileName);

    try {
      // Fetch song data from the API
      const apiUrl = `https://vneerapi.onrender.com/spotify?song=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const { track: trackName, artist: artistName, spotify_url: spotifyLink, download_link: downloadLink } = response.data;

      if (!downloadLink) {
        sendMessage(senderId, { text: 'Sorry, no download link found for that song.' }, pageAccessToken);
        return;
      }

      // Send initial message about the song
      sendMessage(senderId, {
        text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`
      }, pageAccessToken);

      // Ensure temp directory exists
      await fs.ensureDir(tempDir);

      // Download audio file
      const inputFilePath = path.join(tempDir, `${Date.now()}_input.mp3`);
      const writer = fs.createWriteStream(inputFilePath);
      const downloadResponse = await axios.get(downloadLink, { responseType: 'stream' });
      downloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Convert audio using FFmpeg
      await new Promise((resolve, reject) => {
        ffmpeg(inputFilePath)
          .audioCodec('libmp3lame')
          .on('end', resolve)
          .on('error', reject)
          .save(outputFilePath);
      });

      // Upload file as a Facebook attachment
      const formData = new FormData();
      formData.append('filedata', fs.createReadStream(outputFilePath));

      const attachmentUploadUrl = `https://graph.facebook.com/v20.0/me/message_attachments?access_token=${pageAccessToken}`;
      const attachmentResponse = await axios.post(attachmentUploadUrl, formData, {
        headers: formData.getHeaders(),
      });

      const attachmentId = attachmentResponse.data.attachment_id;

      // Send the uploaded file as an audio attachment
      sendMessage(senderId, {
        attachment: {
          type: 'audio',
          payload: {
            attachment_id: attachmentId,
          },
        },
      }, pageAccessToken);
    } catch (error) {
      console.error('Critical Error:', error.message || error.response?.data || error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    } finally {
      // Cleanup temp files
      try {
        await fs.remove(tempDir);
      } catch (cleanupError) {
        console.error('Cleanup Error:', cleanupError.message || cleanupError);
      }
    }
  },
};
