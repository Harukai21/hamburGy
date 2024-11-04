const axios = require('axios');

module.exports = {
  name: "itunes",
  description: "Search iTunes content and send audio/video as an attachment",
  usage: "/itunes <searchTerm>",
  author: "Joshua Sy",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchTerm = args.join(" ");

    if (!searchTerm) {
      console.error("No search term provided.");
      return sendMessage(senderId, { text: "Please provide a search term to find content on iTunes.\n Usage example: /itunes Taylor Swift" }, pageAccessToken);
    }

    try {
      console.log(`Searching iTunes for: ${searchTerm}`);
      
      const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}`);
      const data = response.data.results[0];

      if (data) {
        const {
          collectionName,
          artistName,
          collectionPrice,
          collectionExplicitness,
          trackCount,
          copyright,
          country,
          currency,
          releaseDate,
          primaryGenreName,
          previewUrl,
          kind // can indicate the media type, e.g., "music-video" for video content
        } = data;

        console.log(`Content found on iTunes: ${collectionName} by ${artistName}`);
        
        // Notify the user about the search result details
        sendMessage(senderId, {
          text: `Title: ${collectionName}\nArtist: ${artistName}\nPrice: ${currency} ${collectionPrice}\nExplicit: ${collectionExplicitness}\nTrack Count: ${trackCount}\nCopyright: ${copyright}\nCountry: ${country}\nRelease Date: ${releaseDate}\nGenre: ${primaryGenreName}`
        }, pageAccessToken);

        // Determine attachment type (audio or video)
        const attachmentType = kind === "music-video" ? 'video' : 'audio';

        // Send the media preview (audio or video) as an attachment
        sendMessage(senderId, {
          attachment: {
            type: attachmentType,
            payload: {
              url: previewUrl,
              is_reusable: false
            }
          }
        }, pageAccessToken);

      } else {
        console.error(`No iTunes content found for: ${searchTerm}`);
        sendMessage(senderId, { text: "No iTunes content found for the given search term. Please try again with a different keyword." }, pageAccessToken);
      }
      
    } catch (error) {
      console.error("iTunes Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while fetching iTunes content. Please try again later." }, pageAccessToken);
    }
  }
};
