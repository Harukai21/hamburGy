const { Client } = require("youtubei");
const { ytdown } = require("nayan-media-downloader");
const youtube = new Client();

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

      // Select the top 3 results
      const topResults = searchResults.items.slice(0, 3);

      // Send the options to the user with buttons 1, 2, 3
      let buttons = topResults.map((result, index) => ({
        content_type: 'text',
        title: `${index + 1}. ${result.title}`,
        payload: JSON.stringify({
          action: "select_video",
          videoIndex: index,
          videoId: result.id?.videoId || result.id,
          title: result.title
        })
      }));

      sendMessage(senderId, {
        text: "Please choose a video:",
        quick_replies: buttons
      }, pageAccessToken);

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  },

  // This function handles the postback when the user selects a video to download
  async handlePostback(senderId, payload, pageAccessToken, sendMessage) {
    try {
      const { videoId, title } = JSON.parse(payload);

      if (!videoId) {
        return sendMessage(senderId, { text: "No valid video was selected." }, pageAccessToken);
      }

      // Send the "Downloading" message first
      sendMessage(senderId, { text: `Downloading "${title}" as audio...` }, pageAccessToken);

      try {
        // Download the selected video
        const videoInfo = await ytdown(`https://youtu.be/${videoId}`);

        if (videoInfo.status) {
          const videoData = videoInfo.data;
          const videoDownloadUrl = videoData.video;

          // After sending the "Downloading" message, send the audio file
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
        console.error("Download Error:", error);
        sendMessage(senderId, { text: "An error occurred while trying to download the song." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Postback Error:", error);
      sendMessage(senderId, { text: "An error occurred while processing your request." }, pageAccessToken);
    }
  }
};
