const axios = require('axios');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs-extra');
const path = require('path');

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
      const apiUrl = `https://vneerapi.onrender.com/spotify?song=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      // Extract song information
      const trackName = response.data.track;
      const artistName = response.data.artist;
      const spotifyLink = response.data.spotify_url;
      const downloadLink = response.data.download_link;

      if (!downloadLink) {
        sendMessage(
          senderId,
          { text: 'Sorry, no download link found for that song.' },
          pageAccessToken
        );
        return;
      }

      // Ensure temporary directory exists
      await fs.ensureDir(tempDir);

      // Download and process the audio file using FFmpeg
      const inputFilePath = path.join(tempDir, `${Date.now()}_input.mp3`);
      const writer = fs.createWriteStream(inputFilePath);

      const downloadResponse = await axios.get(downloadLink, {
        responseType: 'stream',
      });
      downloadResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      // Convert the audio file using FFmpeg (if needed)
      await new Promise((resolve, reject) => {
        ffmpeg(inputFilePath)
          .audioCodec('libmp3lame') // Ensure MP3 encoding
          .on('end', resolve)
          .on('error', reject)
          .save(outputFilePath);
      });

      // Upload the processed file as a Facebook attachment
      const attachmentUploadUrl = `https://graph.facebook.com/v21.0/me/message_attachments?access_token=${pageAccessToken}`;
      const fileStream = fs.createReadStream(outputFilePath);

      const formData = new FormData();
      formData.append('filedata', fileStream);

      const attachmentResponse = await axios.post(attachmentUploadUrl, formData, {
        headers: formData.getHeaders(),
      });

      const attachmentId = attachmentResponse.data.attachment_id;

      // Send the uploaded MP3 file as an attachment
      sendMessage(
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

      // Cleanup temporary files
      await fs.remove(tempDir);

      // Send confirmation about the song
      sendMessage(
        senderId,
        {
          text: `🎵 Song: ${trackName}\n🎤 Artist: ${artistName}\n🔗 Spotify: ${spotifyLink}`,
        },
        pageAccessToken
      );
    } catch (error) {
      console.error('Error processing Spotify song:', error);
      sendMessage(
        senderId,
        { text: 'Sorry, there was an error processing your request.' },
        pageAccessToken
      );
    } finally {
      // Cleanup temp files in case of an error
      await fs.remove(tempDir);
    }
  },
};
