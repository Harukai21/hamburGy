const axios = require('axios');

module.exports = {
  name: "fbdl",
  description: "Downloads video from Facebook and uploads to Facebook Graph API",
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

      // Choose the best available resolution (HD or SD)
      const videoUrlToUpload = videoData.resolutions.HD || videoData.resolutions.SD;

      console.log("Uploading video to Facebook...");
      
      // Upload the video to Facebook
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v21.0/me/message_attachments`,
        {
          message: {
            attachment: {
              type: "video",
              payload: {
                url: videoUrlToUpload
              }
            }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${pageAccessToken}`,
            "Content-Type": "application/json"
          }
        }
      );

      const attachmentId = uploadResponse.data.attachment_id;

      if (!attachmentId) {
        console.error("Failed to upload video to Facebook.");
        return sendMessage(senderId, { text: "Failed to upload the video to Facebook." }, pageAccessToken);
      }

      console.log("Video uploaded successfully. Sending to user...");

      // Send the uploaded video
      sendMessage(senderId, {
        attachment: {
          type: "video",
          payload: {
            attachment_id: attachmentId
          }
        }
      }, pageAccessToken);

    } catch (error) {
      // Log and handle any errors that occur during the request or processing
      console.error("Error fetching or uploading Facebook video:", error);
      sendMessage(senderId, { text: "An error occurred while processing the Facebook video." }, pageAccessToken);
    }
  }
};
