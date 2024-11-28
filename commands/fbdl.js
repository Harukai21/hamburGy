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

      console.log(`Passing HD link to proxy: ${hdLink}`);
      console.log(`Proxy URL generated: ${proxyUrl}`);

      // Validate the proxy URL
      const proxyResponse = await axios.head(proxyUrl, { validateStatus: false });
      console.log("Response from proxy server:", {
        status: proxyResponse.status,
        headers: proxyResponse.headers,
      });

      if (proxyResponse.status !== 200) {
        console.error("Proxy server did not return a successful response.");
        return sendMessage(senderId, { text: "Failed to fetch video stream. Please try again later." }, pageAccessToken);
      }

      // Send the video as an attachment
      sendMessage(senderId, {
        attachment: {
          type: 'video', // Correct type for Messenger API
          payload: {
            url: proxyUrl, // Video URL must be publicly accessible
          },
        },
      }, pageAccessToken);

      console.log("Video successfully sent to user.");
    } catch (error) {
      console.error("Error fetching Facebook video:", error.response ? error.response.data : error.message);
      sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
    }
  },
};
