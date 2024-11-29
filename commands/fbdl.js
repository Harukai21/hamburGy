const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook",
  usage: '/fbdl <url>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const url = args[0];
    
    // If there's no URL provided, respond with a message
    if (!url) {
      console.error("No URL provided.");
      return sendMessage(senderId, { text: "Please provide a Facebook video URL." }, pageAccessToken);
    }

    try {
  console.log(`Fetching Facebook video for URL: ${url}`);
  const response = await axios.get(`https://vneerapi.onrender.com/fbdl3?url=${encodeURIComponent(url)}`);
  const videoData = response.data;

  if (!videoData || !videoData.downloadLink) {
    console.error(`No results found for: ${url}`);
    return sendMessage(senderId, { text: "No results found. Please try again with a different URL." }, pageAccessToken);
  }

  // Validate file size
  const { headers } = await axios.head(videoData.downloadLink);
  const fileSize = parseInt(headers['content-length'], 10);
  if (fileSize > 25 * 1024 * 1024) {
    return sendMessage(senderId, { text: "The video is too large to send via Messenger." }, pageAccessToken);
  }

  // Send the video
  sendMessage(senderId, {
    attachment: {
      type: 'video',
      payload: {
        url: videoData.downloadLink,
        is_reusable: true
      }
    }
  }, pageAccessToken);

} catch (error) {
  console.error("Error fetching Facebook video:", error);
  sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
   
    }
  }
};
