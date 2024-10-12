const { Prodia } = require("prodia.js");

const { generateImageSDXL, wait } = Prodia("eaca0864-70a4-4653-8dc7-f5ba3918326f");

const models = [
  "0. animagineXLV3_v30.safetensors [75f2f05b]",
  "1. devlishphotorealism_sdxl15.safetensors [77cba69f]",
  "2. dreamshaperXL10_alpha2.safetensors [c8afe2ef]",
  "3. dynavisionXL_0411.safetensors [c39cc051]",
  "4. juggernautXL_v45.safetensors [e75f5471]",
  "5. realismEngineSDXL_v10.safetensors [af771c3f]",
  "6. realvisxlV40.safetensors [f7fdcb51]",
  "7. sd_xl_base_1.0.safetensors [be9edd61]",
  "8. sd_xl_base_1.0_inpainting_0.1.safetensors [5679a81a]",
  "9. turbovisionXL_v431.safetensors [78890989]"
];

module.exports = {
  name: 'prodia',
  description: 'Generate AI art using the Prodia SDXL models.',
  usage: '/prodia <prompt>:<model number>',
  author: 'Your Name',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ');

    let model = Math.floor(Math.random() * models.length).toString(); // Random model if not provided

    // Check if the prompt includes a model number
    if (prompt.includes(':')) {
      const parts = prompt.split(':');
      const queryPrompt = parts[0].trim();
      const modelNumber = parseInt(parts[1].trim());

      if (!isNaN(modelNumber) && modelNumber >= 0 && modelNumber < models.length) {
        model = modelNumber.toString();
      } else {
        return sendMessage(senderId, { text: '❗ Invalid model number. Use a model number between 0 and 9.' }, pageAccessToken);
      }
    }

    if (!prompt) {
      const modelsList = models.map((model) => `${model}`).join('\n');
      return sendMessage(
        senderId, 
        { text: `Please provide a prompt.\n\nUsage: /prodia {prompt}\nExample: /prodia a beautiful landscape\n\nOr specify a model: /prodia {prompt}:{model number}\nExample: /prodia a beautiful landscape:5\n\nModels:\n${modelsList}` },
        pageAccessToken
      );
    }

    try {
      const processingMessage = await sendMessage(senderId, { text: '⚡ Generating your image. Please wait...' }, pageAccessToken);

      const modelString = models[parseInt(model)].split(' ')[0]; // Get model identifier

      const result = await generateImageSDXL({
        prompt: prompt,
        model: modelString,
        style_preset: "photographic"
      });

      const image = await wait(result);
      const imageUrl = image.url;  // Directly use the URL from the API response

      // Send the image directly using the image URL
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl, // Send the image without downloading
            is_reusable: true // Optional: set to reusable for future use
          }
        }
      }, pageAccessToken);

      await sendMessage(senderId, { text: '🎨 Image generation complete!' }, pageAccessToken);

    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: '❌ There was an error generating your image. Please try again later.' }, pageAccessToken);
    }
  }
};
