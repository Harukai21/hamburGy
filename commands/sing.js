const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');

const youtube = new Client();

module.exports = {
  name: "sing",
  description: "downloads mp3 from youtube",
  usage: '/sing <songTitle>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      
      const searchResults = await youtube.search(searchQuery, { type: "video" });
      
      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Shuffle search results to randomize selection
      const shuffledResults = searchResults.items.sort(() => Math.random() - 0.5);
      
      let video, videoId, videoDownloadUrl;
      
      // Loop through shuffled results to find a downloadable video
      for (let result of shuffledResults) {
        video = result;
        videoId = video.id?.videoId || video.id;

        console.log(`Attempting to download audio for video: ${video.title}`);
        
        // Notify the user that the download attempt is starting
        sendMessage(senderId, { text: `Downloading "${video.title}" as audio...` }, pageAccessToken);

        try {
          const videoInfo = await ytdown(`https://youtu.be/${videoId}`);
          
          if (videoInfo.status) {
            videoDownloadUrl = videoInfo.data.video;
            console.log(`Download successful: ${video.title}`);
            break;
          } else {
            console.warn(`Download failed for video: ${video.title}. Trying next result.`);
          }

        } catch (error) {
          console.error("Download Error:", error);
        }
      }
      
      // If a downloadable video was found, send it; otherwise, notify the user
      if (videoDownloadUrl) {
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: videoDownloadUrl,
              is_reusable: false
            }
          }
        }, pageAccessToken);
      } else {
        console.error("No downloadable video found in search results.");
        sendMessage(senderId, { text: "Failed to download the audio. Please try again." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
