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

      // Prepare a message showing the top 3 video titles
      let messageText = "Please choose a video:\n";
      topResults.forEach((result, index) => {
        messageText += `${index + 1}. ${result.title}\n`;
      });

      // Send the options to the user with buttons /1, /2, /3
      const buttons = [
        {
          content_type: 'text',
          title: '/1',
          payload: JSON.stringify({ action: "select_video", videoIndex: 0, videoId: topResults[0].id?.videoId || topResults[0].id })
        },
        {
          content_type: 'text',
          title: '/2',
          payload: JSON.stringify({ action: "select_video", videoIndex: 1, videoId: topResults[1].id?.videoId || topResults[1].id })
        },
        {
          content_type: 'text',
          title: '/3',
          payload: JSON.stringify({ action: "select_video", videoIndex: 2, videoId: topResults[2].id?.videoId || topResults[2].id })
        }
      ];

      // Save the topResults in the sender session for later use when a number is sent
      sendMessage(senderId, {
        text: messageText,
        quick_replies: buttons
      }, pageAccessToken);

      // Save top results to an in-memory storage or database for senderId
      this._userChoices = this._userChoices || {};
      this._userChoices[senderId] = topResults;

    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  },

  // This function handles the postback when the user selects a video to download (either by button or manually typing /1)
  async handleSelection(senderId, selection, pageAccessToken, sendMessage) {
    try {
      // Retrieve the saved topResults for the user
      const topResults = this._userChoices?.[senderId];
      if (!topResults || !topResults[selection]) {
        return sendMessage(senderId, { text: "No valid video was selected." }, pageAccessToken);
      }

      const videoId = topResults[selection].id?.videoId || topResults[selection].id;
      if (!videoId) {
        return sendMessage(senderId, { text: "No valid video was selected." }, pageAccessToken);
      }

      // Send the "Downloading" message first
      sendMessage(senderId, { text: `Downloading audio...` }, pageAccessToken);

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
      console.error("Selection Error:", error);
      sendMessage(senderId, { text: "An error occurred while processing your request." }, pageAccessToken);
    }
  }
};
