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
    
    // If there's no search query, respond with a message
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
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
      console.log(`Downloading audio for video: ${video.title}`);
      sendMessage(senderId, { text: `Downloading "${video.title}" as audio...` }, pageAccessToken);

      try {
        // Attempt to download the video using ytdown
        const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;

          console.log(`Download successful: ${video.title}`);
          
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
          console.error(`Failed to download audio for video: ${video.title}`);
          sendMessage(senderId, { text: "Failed to download the audio." }, pageAccessToken);
        }

      } catch (error) {
        // Log the specific error for the download failure
        console.error("Download Error:", error);
        sendMessage(senderId, { text: "An error occurred while trying to play the song." }, pageAccessToken);
      }

    } catch (error) {
      // Log the specific error for the search failure
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
