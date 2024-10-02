const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');

const youtube = new Client();

module.exports = {
  name: "sing",
  description: "Automatically play music via search keyword",
  author: "Biru (modified)",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      const searchResults = await youtube.search(searchQuery, { type: "video" });

      if (!searchResults.items.length) {
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Automatically select the first video
      const video = searchResults.items[0];
      const videoId = video.id?.videoId || video.id;

      sendMessage(senderId, { text: `Downloading "${video.title}" as audio...` }, pageAccessToken);

      try {
        const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;

          const cachePath = path.join(__dirname, "cache", `music.mp3`);
          await downloadVideo(videoDownloadUrl, cachePath);

          // Upload the audio file to Facebook
          const formData = new FormData();
          formData.append('message', JSON.stringify({
            'attachment': {
              'type': 'audio',
              'payload': { 'is_reusable': true }
            }
          }));
          formData.append('filedata', fs.createReadStream(cachePath));

          const uploadResponse = await axios.post(`https://graph.facebook.com/v17.0/me/message_attachments?access_token=${pageAccessToken}`, formData, {
            headers: formData.getHeaders()
          });

          const attachmentId = uploadResponse.data.attachment_id;

          // Send the audio file using attachment_id
          sendMessage(senderId, {
            attachment: {
              type: 'audio',
              payload: {
                attachment_id: attachmentId
              }
            }
          }, pageAccessToken);

          // Optionally delete the file after sending
          fs.unlinkSync(cachePath);
        } else {
          sendMessage(senderId, { text: "Failed to download the audio." }, pageAccessToken);
        }

      } catch (error) {
        console.error("Error:", error);
        sendMessage(senderId, { text: "An error occurred while trying to play the song." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};

// Helper function for downloading video
async function downloadVideo(url, filePath) {
  const writer = fs.createWriteStream(filePath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}
