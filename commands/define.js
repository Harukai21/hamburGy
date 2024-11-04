const axios = require("axios");

module.exports = {
  name: "define",
  description: "Retrieve definitions and meanings of English words",
  usage: "/definev2 <word>",
  author: "August Quinn",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const word = args.join(" ");
    
    if (!word) {
      console.error("No word provided.");
      return sendMessage(senderId, { text: "Please provide a word to look up." }, pageAccessToken);
    }

    try {
      console.log(`Looking up definition for: ${word}`);
      
      // Fetch definition from dictionary API
      const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      const entry = response.data[0];

      const meanings = entry.meanings.map((meaning) => {
        const partOfSpeech = meaning.partOfSpeech;
        const definitions = meaning.definitions.map((definition) => `  ⌲ ${definition.definition}`).join("\n");
        return `  ❑ ${partOfSpeech}\n${definitions}`;
      }).join("\n\n");

      let message = `𝗪𝗢𝗥𝗗: ${entry.word}\n`;

      if (entry.phonetics && entry.phonetics.length > 0) {
        message += `𝗣𝗛𝗢𝗡𝗘𝗧𝗜𝗖: ${entry.phonetics[0].text || "N/A"}\n`;
      }

      if (entry.origin) {
        message += `𝗢𝗥𝗜𝗚𝗜𝗡: ${entry.origin}\n`;
      }

      if (meanings) {
        message += `\n𝗠𝗘𝗔𝗡𝗜𝗡𝗚𝗦\n${meanings}`;
      } else {
        message += "No meanings found.";
      }

      // Send the text message first
      await sendMessage(senderId, { text: message }, pageAccessToken);

      // Fetch audio from tts.quest API
      const audioApi = await axios.get(
        `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(entry.word)}&speaker=3&fbclid=IwAR01Y4UydrYh7kvt0wxmExdzoFTL30VkXsLZZ2HjXjDklJsYy2UR3b9uiHA`
      );

      if (audioApi.data && audioApi.data.success) {
        const audioUrl = audioApi.data.mp3;

        // Send the audio message directly
        await sendMessage(senderId, {
          attachment: {
            type: 'audio',
            payload: {
              url: audioUrl,
              is_reusable: true // Set to true to avoid reuse-related errors
            }
          }
        }, pageAccessToken);
      } else {
        console.warn("Audio generation failed, sending definition without audio.");
      }
      
    } catch (error) {
      console.error("Error fetching word definition:", error);

      if (error.response && error.response.status === 404) {
        sendMessage(senderId, { text: "Word not found. Please check the spelling or try a different word." }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: "An error occurred while trying to retrieve the definition." }, pageAccessToken);
      }
    }
  }
};
