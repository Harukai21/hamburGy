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
      console.log("Response from fbdl API:", response.data); // Log fbdl API response

      const videoData = response.data;

      if (!videoData || !videoData.links || !videoData.links["720p (HD)"]) {
        console.error(`HD video not available for URL: ${videoUrl}`);
        return sendMessage(senderId, { text: "HD video not available. Please try another video." }, pageAccessToken);
      }

      const hdLink = videoData.links["720p (HD)"];
      const proxyUrl = `https://vneerapi.onrender.com/stream?url=${encodeURIComponent(hdLink)}&filename=video.mp4`;

      console.log(`Passing HD link to proxy: ${hdLink}`);
      console.log(`Proxy URL generated: ${proxyUrl}`);

      // Test the proxy server
      const proxyResponse = await axios.get(proxyUrl, { validateStatus: false });
      console.log("Response from proxy server:", {
        status: proxyResponse.status,
        headers: proxyResponse.headers,
        dataSnippet: proxyResponse.data ? proxyResponse.data.toString().substring(0, 100) : null, // Log the first 100 characters of the response
      });

      // Send the video as an attachment via the proxied URL
      sendMessage(senderId, {
        attachment: {
          type: 'file',
          payload: {
            url: proxyUrl,
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
