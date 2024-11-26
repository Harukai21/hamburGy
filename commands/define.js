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
      const definition = response.data[0]?.meanings[0]?.definitions[0]?.definition;

      if (!definition) {
        return sendMessage(senderId, { text: `No definition found for ${word}.` }, pageAccessToken);
      }

      const content = `The definition of ${word} is ${definition}`;
      await sendMessage(senderId, { text: `Definition of ${word}: ${definition}` }, pageAccessToken);

      // Translate content to Japanese
      const translationResponse = await axios.get(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=ja&dt=t&q=${encodeURIComponent(content)}`
      );

      const translatedContent = translationResponse.data[0]?.map((item) => item[0]).join("") || content;

      // Fetch audio from tts.quest API using the translated content
      const audioApi = await axios.get(
        `https://api.tts.quest/v3/voicevox/synthesis?text=${encodeURIComponent(translatedContent)}&speaker=5`
      );

      if (audioApi.data && audioApi.data.mp3StreamingUrl) {
        const audioUrl = audioApi.data.mp3StreamingUrl;

        // Send the audio message
        await sendMessage(senderId, {
          attachment: {
            type: "audio",
            payload: {
              url: audioUrl,
              is_reusable: true
            }
          }
        }, pageAccessToken);
      } else {
        console.warn("Audio generation failed, sending definition without audio.");
      }
    } catch (error) {
      console.error("Error fetching word definition or generating audio:", error);

      if (error.response && error.response.status === 404) {
        sendMessage(senderId, { text: `Word not found. Please check the spelling or try a different word.` }, pageAccessToken);
      } else {
        sendMessage(senderId, { text: `An error occurred while trying to retrieve the definition or generate audio.` }, pageAccessToken);
      }
    }
  }
};
