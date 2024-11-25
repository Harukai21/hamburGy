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

      // Get the first two results
      const topResults = searchResults.items.slice(0, 2);
      if (!topResults.length) {
        console.error("No suitable results found in the top 2.");
        return sendMessage(senderId, { text: "No suitable results found. Please try again." }, pageAccessToken);
      }

      // Function to calculate similarity score
      const calculateSimilarity = (query, title) => {
        const queryWords = query.toLowerCase().split(" ");
        const titleWords = title.toLowerCase().split(" ");
        const matches = queryWords.filter((word) => titleWords.includes(word));
        return matches.length / queryWords.length; // Ratio of matched words
      };

      // Choose the most relevant video
      let bestMatch = topResults[0];
      let highestScore = 0;

      topResults.forEach((video) => {
        const score = calculateSimilarity(searchQuery, video.title || "");
        console.log(`Calculated similarity for "${video.title}": ${score}`);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = video;
        }
      });

      const video = bestMatch;
      const videoId = video.id?.videoId || video.id;

      console.log(`Selected video: ${video.title} with similarity score: ${highestScore}`);

      // Fetch download URL
      const apiUrl = `https://vneerapi.onrender.com/ytmp3?url=https://youtu.be/${videoId}`;
      const response = await axios.get(apiUrl);

      if (!response.data || !response.data.downloadUrl) {
        console.error("Failed to retrieve download URL.");
        return sendMessage(senderId, { text: "Failed to fetch download URL. Please try again." }, pageAccessToken);
      }

      const videoDownloadUrl = response.data.downloadUrl;
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
    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  }
};
