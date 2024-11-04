const axios = require('axios');
const fs = require('fs');
const path = require('path');

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
          kind
        } = data;

        console.log(`Content found on iTunes: ${collectionName} by ${artistName}`);
        
        // Notify user with details
        sendMessage(senderId, {
          text: `Title: ${collectionName}\nArtist: ${artistName}\nPrice: ${currency} ${collectionPrice}\nExplicit: ${collectionExplicitness}\nTrack Count: ${trackCount}\nCountry: ${country}\nRelease Date: ${releaseDate}\nGenre: ${primaryGenreName}`
        }, pageAccessToken);

        // Check if it's a video and prepare file download
        const isVideo = kind === "music-video";
        const fileExtension = isVideo ? 'mp4' : 'm4a';
        const tempFilePath = path.join('/tmp', `tempfile.${fileExtension}`);

        // Download the preview file
        const mediaResponse = await axios({
          url: previewUrl,
          method: 'GET',
          responseType: 'stream'
        });

        // Save the file locally in /tmp
        const writer = fs.createWriteStream(tempFilePath);
        mediaResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        // Confirm file existence
        if (!fs.existsSync(tempFilePath)) {
          console.error("File was not saved correctly");
          return sendMessage(senderId, { text: "An error occurred while preparing the file. Please try again." }, pageAccessToken);
        }

        // Send the media file as an attachment
        const attachment = fs.createReadStream(tempFilePath);
        const attachmentType = isVideo ? 'video' : 'audio';

        sendMessage(senderId, {
          attachment: {
            type: attachmentType,
            payload: {
              is_reusable: false
            }
          },
          filedata: attachment
        }, pageAccessToken);

        // Clean up the file after sending
        fs.unlinkSync(tempFilePath);

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
