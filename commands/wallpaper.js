const axios = require("axios");

module.exports = {
  name: "wallpaper",
  description: "Search for wallpapers e.g /wallpaper nature - 5",
  usage: "/wallpaper search - number",
  author: "Biru",
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const query = args.join(" ").trim().replace(/\s+/g, " ").split("-")[0];
    const number = parseInt(args.join(" ").trim().split("-")[1]) || 5;

    if (!query || isNaN(number)) {
      return sendMessage(senderId, {
        text: "Missing Data. Please provide a search term and optionally the number of images (e.g., /wallpaper nature - 5).",
      }, pageAccessToken);
    }

    try {
      const apiUrl = `https://vneerapi.onrender.com/wallpaper?text=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);

      if (response.data.status && response.data.results.length > 0) {
        const wallpapers = response.data.results.slice(0, number);

        // Inform the user about the results
        await sendMessage(senderId, {
          text: `► Wallpaper Results for: "${query}" (${wallpapers.length} images found):`,
        }, pageAccessToken);

        // Send each image one by one
        for (const wallpaper of wallpapers) {
          try {
            await sendMessage(senderId, {
              attachment: {
                type: 'image',
                payload: {
                  url: wallpaper.image,
                  is_reusable: false,
                },
              },
            }, pageAccessToken);
          } catch (err) {
            console.error(`Failed to send image: ${wallpaper.image}`, err);
          }
        }
      } else {
        return sendMessage(senderId, {
          text: `No wallpapers found for "${query}". Please try a different search term.`,
        }, pageAccessToken);
      }
    } catch (error) {
      console.error("Error fetching wallpapers:", error);
      return sendMessage(senderId, {
        text: "An error occurred while fetching wallpaper results. Please try again later.",
      }, pageAccessToken);
    }
  },
};
