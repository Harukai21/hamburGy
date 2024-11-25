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

      let video, videoId, videoDownloadUrl;

      // Loop through shuffled results to find a downloadable video
      for (let result of shuffledResults) {
        video = result;
        videoId = video.id?.videoId || video.id;

        console.log(`Attempting to fetch download URL for video: ${video.title}`);

        try {
          const apiUrl = `https://vneerapi.onrender.com/ytmp3?url=https://youtu.be/${videoId}`;
          const response = await axios.get(apiUrl);

          if (response.data && response.data.downloadUrl) {
            videoDownloadUrl = response.data.downloadUrl;
            console.log(`Download URL retrieved successfully: ${response.data.title}`);
            break;
          } else {
            console.warn(`Failed to retrieve download URL for video: ${video.title}. Trying next result.`);
          }
        } catch (error) {
          console.error("Error fetching download URL:", error);
        }
      }

      if (videoDownloadUrl) {
        // Extract metadata
        const videoTitle = video.title || "Unknown Title";
        const channelName = video.channel?.name || "Unknown Channel";
        const duration = video.duration || "Unknown Duration";
        const videoUrl = `https://youtu.be/${videoId}`;

        console.log(`Sending metadata: ${videoTitle}, ${channelName}, ${duration}`);

        // Send metadata as a template
        const elements = [
          {
            title: videoTitle,
            subtitle: `Channel: ${channelName}\nDuration: ${duration}`,
            image_url: video.thumbnails?.[0]?.url || "https://i.imgur.com/nGCJW9S.jpeg", // Fallback image
            buttons: [
              {
                type: "web_url",
                url: videoDownloadUrl,
                title: "Download"
              },
              {
                type: "web_url",
                url: videoUrl,
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

        console.log("Sent interactive message with metadata and buttons.");

        // Send the audio file
        await sendMessage(senderId, {
          attachment: {
            type: "audio",
            payload: {
              url: videoDownloadUrl,
              is_reusable: false
            }
          }
        }, pageAccessToken);
        console.log("Sent audio file.");
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
