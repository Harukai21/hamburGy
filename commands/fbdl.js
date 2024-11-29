const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook",
  usage: "/fbdl <url>",
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const videoUrl = args.join(" ");

    if (!videoUrl) {
      console.error("No video URL provided.");
      return sendMessage(
        senderId,
        { text: "Please provide a valid Facebook video URL." },
        pageAccessToken
      );
    }

    try {
      console.log(`Fetching Facebook video data for URL: ${videoUrl}`);

      // Fetch Facebook video data using the API
      const response = await axios.get(`https://vneerapi.onrender.com/fbdl3?url=${encodeURIComponent(videoUrl)}`);
      console.log("Response from fbdl API:", response.data);

      const videoData = response.data;

      if (!videoData || !videoData.downloadLinks || videoData.downloadLinks.length === 0) {
        console.error(`No video links available for URL: ${videoUrl}`);
        return sendMessage(
          senderId,
          { text: "No downloadable video links found. Please try another video." },
          pageAccessToken
        );
      }

      // Select the best available video quality
      let downloadLink = null;
      let quality = null;

      for (const link of videoData.downloadLinks) {
        if (link.quality.includes("360p")) { // Prefer 360p quality
          downloadLink = link.downloadLink;
          quality = link.quality;
          break;
        }
      }

      // Fallback to the first available quality
      if (!downloadLink) {
        downloadLink = videoData.downloadLinks[0].downloadLink;
        quality = videoData.downloadLinks[0].quality;
      }

      console.log(`Selected video quality: ${quality}, Link: ${downloadLink}`);

      // Force sending the video as an attachment
      await sendMessage(
        senderId,
        {
          attachment: {
            type: "video",
            payload: {
              url: downloadLink,
            },
          },
        },
        pageAccessToken
      );

      console.log("Video successfully sent to user.");
    } catch (error) {
      console.error("Error fetching Facebook video:", error.response ? error.response.data : error.message);
      sendMessage(
        senderId,
        { text: "An error occurred while fetching the Facebook video. Please try again later." },
        pageAccessToken
      );
    }
  },
};
