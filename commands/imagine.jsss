const { ApexImagine } = require('apexify.js');

// Style presets for image generation
const stylePresets = [
  "3d-model", "analog-film", "anime", "cinematic", "comic-book", "digital-art",
  "enhance", "fantasy-art", "isometric", "line-art", "low-poly", "neon-punk", 
  "origami", "photographic", "pixel-art", "texture", "craft-clay"
];

module.exports = {
  name: 'imagine',
  description: 'Generates images based on a text prompt using the Prodia model',
  usage: '/imagine <prompt>',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    if (!prompt) {
      return sendMessage(senderId, { text: 'Please provide an image prompt.' }, pageAccessToken);
    }

    // Randomly select a style from the presets
    const randomStyle = stylePresets[Math.floor(Math.random() * stylePresets.length)];

    // Define the image generation options
    const imageOptions = {
      count: 2,
      nsfw: false,
      deepCheck: false,
      nsfwWords: [],
      Api_key: 'eaca0864-70a4-4653-8dc7-f5ba3918326f',
      negative_prompt: "",
      sampler: "DPM++ 2M Karras",
      height: 512,
      width: 512,
      cfg_scale: 9,
      steps: 20,
      seed: -1,
      image_style: randomStyle // Use the randomly selected style
    };

    try {
      console.log(`Generating image with style: ${randomStyle}`);

      // Send the initial text message
      const textMessage = `🎨 Generating images for the prompt: "${prompt}" with style: "${randomStyle}".`;
      await sendMessage(senderId, { text: textMessage }, pageAccessToken);

      // Generate images using ApexImagine
      const imageResponse = await ApexImagine('prodia', prompt, imageOptions);

      if (imageResponse && imageResponse.length > 0) {
        // Send each generated image
        for (const imageUrl of imageResponse) {
          await sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: {
                url: imageUrl,
                is_reusable: true
              }
            }
          }, pageAccessToken)
          .catch(err => {
            console.error('Error sending image:', err);
          });
        }
      } else {
        console.error('Error: No images generated.');
        sendMessage(senderId, { text: 'Failed to generate images for your prompt.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error generating images:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};
