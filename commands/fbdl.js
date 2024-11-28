const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook",
  usage: '/fbdl <url>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const videoUrl = args.join(" ");

    // If no URL is provided, respond with a message
    if (!videoUrl) {
      console.error("No video URL provided.");
      return sendMessage(senderId, { text: "Please provide a valid Facebook video URL." }, pageAccessToken);
    }

    try {
      console.log(`Fetching Facebook video data for URL: ${videoUrl}`);

      // Fetch Facebook video data using the provided API
      const response = await axios.get(`https://vneerapi.onrender.com/fbdl?url=${encodeURIComponent(videoUrl)}`);
      const videoData = response.data;

      if (!videoData || !videoData.links || !videoData.links["720p (HD)"]) {
        console.error(`HD video not available for URL: ${videoUrl}`);
        return sendMessage(senderId, { text: "HD video not available. Please try another video." }, pageAccessToken);
      }

      const hdLink = videoData.links["720p (HD)"];

      console.log(`Sending HD video attachment: ${hdLink}`);

      // Send the video file as an attachment
      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: hdLink,
            is_reusable: true,
          },
        },
      }, pageAccessToken);

    } catch (error) {
      // Log and handle any errors that occur during the request or processing
      console.error("Error fetching Facebook video:", error);
      sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
    }
  },
};
