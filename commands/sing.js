const { Client } = require("youtubei");
const axios = require("axios");

const youtube = new Client();

module.exports = {
  name: "sing",
  description: "downloads mp3 from YouTube",
  usage: "/sing <songTitle>",
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      
      const searchResults = await youtube.search(searchQuery, { type: "video" });
      
      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Shuffle search results to randomize selection
      const shuffledResults = searchResults.items.sort(() => Math.random() - 0.5);
      
      let video, videoId, videoDownloadUrl, videoTitle, channelName, thumbnail;

      // Loop through shuffled results to find a downloadable video
      for (let result of shuffledResults) {
        video = result;
        videoId = video.id?.videoId || video.id;
        videoTitle = video.title || "Unknown Title";
        channelName = video.channel?.name || "Unknown Channel";
        thumbnail = video.thumbnails?.[0]?.url || "https://i.imgur.com/nGCJW9S.jpeg"; // Fallback thumbnail

        console.log(`Attempting to fetch download URL for video: ${videoTitle}`);
        
        // Notify the user that the process is starting
        await sendMessage(senderId, { text: `Fetching download link for "${videoTitle}"...` }, pageAccessToken);

        try {
          const apiUrl = `https://vneerapi.onrender.com/ytmp3?url=https://youtu.be/${videoId}`;
          const response = await axios.get(apiUrl);

          if (response.data && response.data.downloadUrl) {
            videoDownloadUrl = response.data.downloadUrl;
            console.log(`Download URL retrieved successfully: ${response.data.title}`);
            break;
          } else {
            console.warn(`Failed to retrieve download URL for video: ${videoTitle}. Trying next result.`);
          }
        } catch (error) {
          console.error("Error fetching download URL:", error);
        }
      }

      if (videoDownloadUrl) {
        // Create and send a template message
        const elements = [
          {
            title: videoTitle,
            subtitle: `Channel: ${channelName}`,
            image_url: thumbnail,
            buttons: [
              {
                type: "web_url",
                url: videoDownloadUrl,
                title: "Download MP3"
              },
              {
                type: "web_url",
                url: `https://youtu.be/${videoId}`,
                title: "Watch on YouTube"
              }
            ]
          }
        ];

        await sendMessage(senderId, {
          attachment: {
            type: "template",
            payload: {
              template_type: "generic",
              elements
            }
          }
        }, pageAccessToken);

        console.log("Sent interactive template message with metadata and buttons.");
      } else {
        console.error("No downloadable video found in search results.");
        sendMessage(senderId, { text: "Failed to download the audio. Please try again." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
