const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const youtube = new Client();
const TEMP_DIR = '/tmp'; // Adjust to Render's temporary storage

module.exports = {
  name: "video",
  description: "Downloads and trims video (if over 25 MB) from YouTube",
  usage: '/video <videoTitle>',
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      const searchResults = await youtube.search(searchQuery, { type: "video" });
      
      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      const video = searchResults.items[0];
      const videoId = video.id?.videoId || video.id;
      
      console.log(`Downloading video: ${video.title}`);
      sendMessage(senderId, { text: `Downloading "${video.title}"...` }, pageAccessToken);

      try {
        const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;
          const videoPath = path.join(TEMP_DIR, `${videoId}.mp4`);

          const response = await axios({
            url: videoDownloadUrl,
            method: 'GET',
            responseType: 'stream'
          });

          const writer = fs.createWriteStream(videoPath);
          response.data.pipe(writer);
          await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
          });

          const fileSizeInMB = fs.statSync(videoPath).size / (1024 * 1024);
          if (fileSizeInMB <= 25) {
            await sendVideo(senderId, videoPath, pageAccessToken, sendMessage);
          } else {
            await splitAndSendVideo(senderId, videoPath, pageAccessToken, sendMessage);
          }

          fs.unlinkSync(videoPath); // Clean up original file after processing

        } else {
          console.error(`Failed to download video: ${video.title}`);
          sendMessage(senderId, { text: "Failed to download the video." }, pageAccessToken);
        }

      } catch (error) {
        console.error("Download Error:", error);
        sendMessage(senderId, { text: "An error occurred while trying to download the video." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};

// Helper function to send video and wait until the send completes
async function sendVideo(senderId, filePath, pageAccessToken, sendMessage) {
  return new Promise((resolve, reject) => {
    const videoData = fs.createReadStream(filePath);
    sendMessage(senderId, {
      attachment: {
        type: 'video',
        payload: {
          is_reusable: true,
        }
      },
      filedata: videoData
    }, pageAccessToken, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Helper function to split video into parts under 25 MB and send each sequentially
async function splitAndSendVideo(senderId, videoPath, pageAccessToken, sendMessage) {
  const partDir = path.join(TEMP_DIR, `video_parts_${Date.now()}`);
  fs.mkdirSync(partDir);
  
  await new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions('-fs', '25M') // Split video into parts under 25 MB
      .on('end', resolve)
      .on('error', reject)
      .output(path.join(partDir, 'part_%03d.mp4'))
      .run();
  });

  const parts = fs.readdirSync(partDir).sort();
  for (const part of parts) {
    const partPath = path.join(partDir, part);
    await sendVideo(senderId, partPath, pageAccessToken, sendMessage); // Ensure each part is sent
    fs.unlinkSync(partPath); // Delete part only after sending
  }

  fs.rmdirSync(partDir); // Remove the part directory
}
