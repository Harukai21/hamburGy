const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook",
  usage: '/fbdl <url>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const videoUrl = args.join(" ");

    if (!videoUrl) {
      console.error("No video URL provided.");
      return sendMessage(senderId, { text: "Please provide a valid Facebook video URL." }, pageAccessToken);
    }

    try {
      console.log(`Fetching Facebook video data for URL: ${videoUrl}`);

      // Fetch Facebook video data using the provided API
      const response = await axios.get(`https://vneerapi.onrender.com/fbdl?url=${encodeURIComponent(videoUrl)}`);
      console.log("Response from fbdl API:", response.data);

      const videoData = response.data;

      if (!videoData || !videoData.links || !videoData.links["720p (HD)"]) {
        console.error(`HD video not available for URL: ${videoUrl}`);
        return sendMessage(senderId, { text: "HD video not available. Please try another video." }, pageAccessToken);
      }

      const hdLink = videoData.links["720p (HD)"];
      const proxyUrl = `https://vneerapi.onrender.com/stream?url=${encodeURIComponent(hdLink)}`;

      console.log(`Proxy URL generated: ${proxyUrl}`);

      // Fetch the stream API to get the download link
      const streamResponse = await axios.get(proxyUrl);
      console.log("Response from stream API:", streamResponse.data);

      if (!streamResponse.data || !streamResponse.data.link) {
        console.error("Failed to generate download link from stream API.");
        return sendMessage(senderId, { text: "An error occurred while generating the video link." }, pageAccessToken);
      }

      const downloadLink = streamResponse.data.link;

      // Validate the download link
      const validateResponse = await axios.head(downloadLink);
      console.log("Validation response headers:", validateResponse.headers);

      if (!validateResponse.headers['content-type'] || !validateResponse.headers['content-type'].startsWith('video/')) {
        console.error("Invalid video content type:", validateResponse.headers['content-type']);
        return sendMessage(senderId, { text: "The video format is unsupported. Please try another video." }, pageAccessToken);
      }

      // Send the video as an attachment
      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: downloadLink,
            is_reusable: true,
          },
        },
      }, pageAccessToken);

    } catch (error) {
      console.error("Error fetching Facebook video:", error.response ? error.response.data : error.message);
      sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
    }
  },
};
