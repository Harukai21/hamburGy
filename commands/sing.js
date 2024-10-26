const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');

const youtube = new Client();

// Generic retry function for operations like searching and downloading
async function retryOperation(operation, retries = 2) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === retries) throw error;
      attempt++;
      console.warn(`Attempt ${attempt} failed. Retrying...`);
    }
  }
}

// Retry function specifically for sending messages
async function retrySendMessage(sendMessage, senderId, messageContent, pageAccessToken, retries = 2) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      await sendMessage(senderId, messageContent, pageAccessToken);
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      attempt++;
      console.warn(`Message send attempt ${attempt} failed. Retrying...`);
    }
  }
}

module.exports = {
  name: "sing",
  description: "downloads mp3 from youtube",
  usage: '/sing <songTitle>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    if (!searchQuery) {
      console.error("No search query provided.");
      return retrySendMessage(sendMessage, senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      const searchResults = await retryOperation(() => youtube.search(searchQuery, { type: "video" }));
      
      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return retrySendMessage(sendMessage, senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      const video = searchResults.items[0];
      const videoId = video.id?.videoId || video.id;
      
      console.log(`Downloading audio for video: ${video.title}`);
      await retrySendMessage(sendMessage, senderId, { text: `Downloading "${video.title}" as audio...` }, pageAccessToken);

      try {
        const videoInfo = await retryOperation(() => ytdown(`https://youtu.be/${videoId}`));

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;

          console.log(`Download successful: ${video.title}`);
          await retrySendMessage(sendMessage, senderId, {
            attachment: {
              type: 'audio',
              payload: {
                url: videoDownloadUrl,
                is_reusable: false
              }
            }
          }, pageAccessToken);

        } else {
          console.error(`Failed to download audio for video: ${video.title}`);
          await retrySendMessage(sendMessage, senderId, { text: "Failed to download the audio." }, pageAccessToken);
        }

      } catch (error) {
        console.error("Download Error:", error);
        await retrySendMessage(sendMessage, senderId, { text: "An error occurred while trying to play the song." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Search Error:", error);
      await retrySendMessage(sendMessage, senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
