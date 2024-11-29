const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook",
  usage: '/fbdl <url>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const videoUrl = args.join(" ");
    
    // If no video URL is provided, respond with a message
    if (!videoUrl) {
      console.error("No video URL provided.");
      return sendMessage(senderId, { text: "Please provide a valid Facebook video URL." }, pageAccessToken);
    }

    try {
      console.log(`Fetching Facebook video from: ${videoUrl}`);
      
      // Fetch Facebook video data using the provided API
      const response = await axios.get(`https://vneerapi.onrender.com/fbdl4?url=${encodeURIComponent(videoUrl)}`);
      const videoData = response.data;

      if (!videoData || !videoData.resolutions) {
        console.error(`No video data found for URL: ${videoUrl}`);
        return sendMessage(senderId, { text: "No video found. Please check the URL and try again." }, pageAccessToken);
      }

      // Notify the user with the title of the video
      console.log(`Found video: ${videoData.title}`);
      sendMessage(senderId, { text: `Title: ${videoData.title}` }, pageAccessToken);

      // Send the video thumbnail to the user
      sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: videoData.thumbnail,
            is_reusable: true
          }
        }
      }, pageAccessToken);

      // Send the video in HD or fallback to SD if HD is unavailable
      const videoUrlToSend = videoData.resolutions.HD || videoData.resolutions.SD;

      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: videoUrlToSend,
            is_reusable: true
          }
        }
      }, pageAccessToken);

    } catch (error) {
      // Log and handle any errors that occur during the request or processing
      console.error("Error fetching Facebook video:", error);
      sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
    }
  }
};
