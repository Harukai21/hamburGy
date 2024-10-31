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
      if (!searchResults.results.length) {
        console.log("No search results found.");
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      const video = searchResults.results[0];
      const videoTitle = video.title;
      console.log(`Found video: ${videoTitle}`);

      await sendMessage(senderId, { text: `🔍 Found "${videoTitle}", preparing audio...` }, pageAccessToken);

      // Get basic video info and audio URL
      const info = await yt.getBasicInfo(video.id);
      const audioUrl = info.streaming_data?.formats[0].decipher(yt.session.player);
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
      console.error("Error:", error);
      await sendMessage(senderId, { text: "An error occurred while processing your request. Please try again later." }, pageAccessToken);
    }
  }
};
