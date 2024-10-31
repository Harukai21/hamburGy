const { Innertube, UniversalCache } = require("youtubei.js");

module.exports = {
  name: 'Music',
  description: 'Command that lets you play any of your favorite music.',
  usage: '/Music [title]',
  author: 'libyzxy0',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (!args || args.length < 1) {
      console.log("No arguments provided.");
      return sendMessage(senderId, { text: "⚠️ Invalid Use Of Command!\n💡 Usage: Music [title]" }, pageAccessToken);
    }

    try {
      const searchQuery = args.join(" ");
      console.log(`Searching for query: ${searchQuery}`);
      await sendMessage(senderId, { text: `🔍 Searching for "${searchQuery}"...` }, pageAccessToken);

      const yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true,
      });

      console.log("YouTube instance created.");

      // Search for the video
      const searchResults = await yt.music.search(searchQuery, { type: "video" });
      console.log("Search Results:", searchResults);

      if (!searchResults.results.length) {
        console.log("No search results found.");
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      const video = searchResults.results[0];
      const videoTitle = video.title || "Unknown Title";
      console.log(`Found video: ${videoTitle} (ID: ${video.id})`);

      await sendMessage(senderId, { text: `🔍 Found "${videoTitle}", preparing audio...` }, pageAccessToken);

      // Get basic video info
      const info = await yt.getBasicInfo(video.id);
      console.log("Video Basic Info:", info);

      if (!info.streaming_data || !info.streaming_data.formats) {
        console.log("No streaming data available.");
        return sendMessage(senderId, { text: "Failed to retrieve audio URL. No streaming data available." }, pageAccessToken);
      }

      // Find the first available audio format
      const audioFormat = info.streaming_data.formats.find(format => format.mimeType.includes('audio'));
      console.log("Audio Format:", audioFormat);

      if (!audioFormat) {
        console.log("No valid audio format found.");
        return sendMessage(senderId, { text: "Failed to retrieve audio URL. No audio format found." }, pageAccessToken);
      }

      // Retrieve and decipher the URL if required
      const audioUrl = audioFormat.decipher ? audioFormat.decipher(yt.session.player) : audioFormat.url;
      console.log(`Audio URL retrieved: ${audioUrl}`);

      if (audioUrl) {
        console.log("Sending audio message...");
        await sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: audioUrl,
              is_reusable: true
            }
          }
        }, pageAccessToken);
        console.log("Audio message sent.");
      } else {
        console.log("Failed to retrieve audio URL.");
        await sendMessage(senderId, { text: "Failed to retrieve audio URL." }, pageAccessToken);
      }

    } catch (error) {
      console.error("Error during execution:", error);
      await sendMessage(senderId, { text: "An error occurred while processing your request. Please try again later." }, pageAccessToken);
    }
  }
};