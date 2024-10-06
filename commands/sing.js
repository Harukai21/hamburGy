const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');

const youtube = new Client();

module.exports = {
  name: "sing",
  description: "/sing <songTitle>",
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

          // Send the audio file using the video URL directly
          sendMessage(senderId, {
            attachment: {
              type: 'audio',
              payload: {
                url: videoDownloadUrl,
                is_reusable: true
              }
            }
          }, pageAccessToken);

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
