const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

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
      const response = await axios.get(`https://vneerapi.onrender.com/fbdl?url=${encodeURIComponent(videoUrl)}`);
      const videoData = response.data;

      if (!videoData || !videoData.links || !videoData.links["720p (HD)"]) {
        console.error(`HD video not available for URL: ${videoUrl}`);
        return sendMessage(senderId, { text: "HD video not available. Please try another video." }, pageAccessToken);
      }

      const hdLink = videoData.links["720p (HD)"];
      console.log(`Downloading video from: ${hdLink}`);

      // Download the video file temporarily
      const tempFilePath = '/tmp/video.mp4';
      const file = fs.createWriteStream(tempFilePath);

      https.get(hdLink, function (response) {
        response.pipe(file);
        file.on('finish', async () => {
          file.close();

          // Upload video to Facebook
          const formData = new FormData();
          formData.append('filedata', fs.createReadStream(tempFilePath));

          const uploadResponse = await axios.post(
            `https://graph.facebook.com/v17.0/me/message_attachments?access_token=${pageAccessToken}`,
            formData,
            { headers: formData.getHeaders() }
          );

          const attachmentId = uploadResponse.data.attachment_id;

          console.log(`Uploaded video. Attachment ID: ${attachmentId}`);

          // Send the video to the user
          sendMessage(senderId, {
            attachment: {
              type: 'video',
              payload: { attachment_id: attachmentId },
            },
          }, pageAccessToken);

          // Cleanup the temporary file
          fs.unlinkSync(tempFilePath);
        });
      }).on('error', (error) => {
        console.error("Error downloading video:", error);
        sendMessage(senderId, { text: "An error occurred while downloading the video." }, pageAccessToken);
      });
    } catch (error) {
      console.error("Error processing request:", error);
      sendMessage(senderId, { text: "An error occurred while fetching the Facebook video." }, pageAccessToken);
    }
  },
};
