import { Innertube, UniversalCache } from "youtubei.js";

export const config = {
  name: 'Music',
  description: 'Command that lets you play any of your favorite music.',
  usage: 'Music [title]',
  
  author: 'libyzxy0'
};

export async function execute({ senderId, args, pageAccessToken, sendMessage }) {
  if (args.length < 1) {
    return sendMessage(senderId, { text: "⚠️ Invalid Use Of Command!\n💡 Usage: Music [title]" }, pageAccessToken);
  }

  try {
    const query = args.join(" ");
    sendMessage(senderId, { text: `🔍 Searching for "${query}"...` }, pageAccessToken);

    const yt = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true,
    });

    // Search for the video
    const searchResults = await yt.music.search(query, { type: "video" });
    if (!searchResults.results.length) {
      return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
    }

    const video = searchResults.results[0];
    const videoTitle = video.title;
    
    sendMessage(senderId, { text: `🔍 Found "${videoTitle}", preparing audio...` }, pageAccessToken);

    // Get basic video info and audio URL
    const info = await yt.getBasicInfo(video.id);
    const audioUrl = info.streaming_data?.formats[0].decipher(yt.session.player);

    if (audioUrl) {
      // Send the audio file directly using the URL
      sendMessage(senderId, {
        attachment: {
          type: 'audio',
          payload: {
            url: audioUrl,
            is_reusable: true
          }
        }
      }, pageAccessToken);
    } else {
      sendMessage(senderId, { text: "Failed to retrieve audio URL." }, pageAccessToken);
    }

  } catch (error) {
    console.error(`Error: ${error}`);
    sendMessage(senderId, { text: "An error occurred while processing your request. Please try again later." }, pageAccessToken);
  }
}
