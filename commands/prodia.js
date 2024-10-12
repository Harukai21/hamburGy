const { Prodia } = require("prodia.js");
const { generateImageSDXL, getSDXLModels, wait } = Prodia("eaca0864-70a4-4653-8dc7-f5ba3918326f");

module.exports = {
  name: 'prodia',
  description: 'Generate AI art using the Prodia SDXL models.',
  usage: '/prodia <prompt>:<model number>',
  author: 'Your Name',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userInput = args.join(' ');
    let [prompt, modelIndex] = userInput.split(':');
    prompt = prompt ? prompt.trim() : null;

    if (!prompt) {
      return sendMessage(
        senderId, 
        { text: `Please provide a prompt.\n\nUsage: /prodia {prompt}\nExample: /prodia a beautiful landscape\n\nOr specify a model: /prodia {prompt}:{model number}` },
        pageAccessToken
      );
    }

    try {
      const models = await getSDXLModels(); // Fetching available models dynamically

      if (!models || models.length === 0) {
        return sendMessage(senderId, { text: '❌ No available models found. Please try again later.' }, pageAccessToken);
      }

      let model;
      if (modelIndex && !isNaN(parseInt(modelIndex)) && parseInt(modelIndex) >= 0 && parseInt(modelIndex) < models.length) {
        model = models[parseInt(modelIndex)]; // Use the specified model
      } else {
        model = models[Math.floor(Math.random() * models.length)]; // Randomly select a model
      }

      // Log the selected model for debugging
      console.log('Prompt:', prompt);
      console.log('Selected Model:', model);

      // Inform the user that the image is being generated
      await sendMessage(senderId, { text: '⚡ Generating your image. Please wait...' }, pageAccessToken);

      // Define style presets
      const stylePresets = [
        "3d-model", "analog-film", "anime", "cinematic", "comic-book", "digital-art",
        "enhance", "fantasy-art", "isometric", "line-art", "low-poly", "neon-punk", 
        "origami", "photographic", "pixel-art", "texture", "craft-clay"
      ];

      // Randomly select a style preset
      const stylePreset = stylePresets[Math.floor(Math.random() * stylePresets.length)];

      // Generate the image with the selected model and style
      const result = await generateImageSDXL({
        prompt: prompt,
        model: model,
        style_preset: stylePreset // Use the randomly selected style preset
      });

      const image = await wait(result);
      const imageUrl = image.url;  // Get the image URL from the response

      // Send the image directly using the image URL
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl, // Directly send the generated image
            is_reusable: true // Optional: make it reusable
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error generating image:', error.message);
      sendMessage(senderId, { text: '❌ There was an error generating your image. Please try again later.' }, pageAccessToken);
    }
  }
};
