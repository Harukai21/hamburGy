const axios = require('axios');

module.exports = {
  name: "tiktok",
  description: "Downloads video from TikTok",
  usage: '/tiktok <title>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    // If there's no search query, respond with a message
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword." }, pageAccessToken);
    }

    try {
      console.log(`Searching TikTok for: ${searchQuery}`);
      
      // Fetch TikTok video data using the provided API
      const response = await axios.get(`https://vneerapi.onrender.com/tiktok?query=${encodeURIComponent(searchQuery)}`);
      const videoData = response.data;

      if (!videoData || !videoData.no_watermark) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Notify the user with the title of the video
      console.log(`Found video: ${videoData.title}`);
      sendMessage(senderId, { text: `Title: ${videoData.title}` }, pageAccessToken);

      // Send the video file using the no_watermark video URL
      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: videoData.no_watermark,
            is_reusable: true
          }
        }
      }, pageAccessToken);

    } catch (error) {
      // Log and handle any errors that occur during the request or processing
      console.error("Error fetching TikTok video:", error);
      sendMessage(senderId, { text: "An error occurred while fetching the TikTok video." }, pageAccessToken);
    }
  }
};
