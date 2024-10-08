const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const youtube = new Client();

let searchResultsCache = {};  // A simple cache to store search results by senderId

module.exports = {
  name: "play",
  description: "/play <songTitle>",
  author: "Biru (modified)",

  // This function handles the initial song search and sends the buttons with the top 3 results
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    
    if (!searchQuery) {
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      // Search YouTube for the query
      const searchResults = await youtube.search(searchQuery, { type: "video" });
      
      if (!searchResults.items.length) {
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      // Select the top 3 results and store them in the cache
      const topResults = searchResults.items.slice(0, 3);
      searchResultsCache[senderId] = topResults;  // Store the results by sender ID

      // Send the options to the user
      const message = `Please choose a video:\n1. ${topResults[0].title}\n2. ${topResults[1].title}\n3. ${topResults[2].title}`;
      sendMessage(senderId, { text: message }, pageAccessToken);

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  },

  // This function handles when the user selects a video by typing /1, /2, or /3
  async handleSelection(senderId, selection, pageAccessToken, sendMessage) {
    try {
      const videoIndex = parseInt(selection.replace('/', '')) - 1;

      // Check if the search results are available for the senderId
      if (!searchResultsCache[senderId] || !searchResultsCache[senderId][videoIndex]) {
        return sendMessage(senderId, { text: "No valid video selection found." }, pageAccessToken);
      }

      const selectedVideo = searchResultsCache[senderId][videoIndex];
      const videoId = selectedVideo.id?.videoId || selectedVideo.id;

      sendMessage(senderId, { text: `Downloading "${selectedVideo.title}" as audio...` }, pageAccessToken);

      // Download the video as audio
      const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

      if (videoInfo.status) {
        const videoDownloadUrl = videoInfo.data.video;

        // Send the audio file to the user
        sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: videoDownloadUrl,
              is_reusable: true
            }
          }
        }, pageAccessToken);

      } else {
        sendMessage(senderId, { text: "Failed to download the audio." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Selection Error:", error);
      sendMessage(senderId, { text: "An error occurred while processing your request." }, pageAccessToken);
    }
  }
};
