const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

const youtube = new Client();

module.exports = {
  name: "video",
  description: "Downloads video from YouTube",
  usage: '/video <videoTitle>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    // If there's no search query, respond with a message
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      
      // Search YouTube for the query
      const searchResults = await youtube.search(searchQuery, { type: "video" });
      
      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Select the first video from the search results
      const video = searchResults.items[0];
      const videoId = video.id?.videoId || video.id;
      
      // Notify the user that the download is starting
      console.log(`Downloading video: ${video.title}`);
      sendMessage(senderId, { text: `Downloading "${video.title}"...` }, pageAccessToken);

      try {
        // Attempt to download the video using ytdown
        const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;

          // Check the size of the video before sending
          const response = await axios.head(videoDownloadUrl);
          const contentLength = response.headers['content-length'];
          const fileSizeInMB = contentLength / (1024 * 1024);

          if (fileSizeInMB > 25) {
            console.error(`File exceeds 25MB limit: ${video.title} is ${fileSizeInMB.toFixed(2)}MB.`);
            return sendMessage(senderId, { text: "The video exceeds the 25MB limit." }, pageAccessToken);
          }

          console.log(`Download successful: ${video.title}`);
          
          // Send the video file using the video URL directly
          sendMessage(senderId, {
            attachment: {
              type: 'video',
              payload: {
                url: videoDownloadUrl,
                is_reusable: true
              }
            }
          }, pageAccessToken);

        } else {
          console.error(`Failed to download video: ${video.title}`);
          sendMessage(senderId, { text: "Failed to download the video." }, pageAccessToken);
        }

      } catch (error) {
        // Log the specific error for the download failure
        console.error("Download Error:", error);
        sendMessage(senderId, { text: "An error occurred while trying to download the video." }, pageAccessToken);
      }

    } catch (error) {
      // Log the specific error for the search failure
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
