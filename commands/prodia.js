const { Prodia } = require("prodia.js");
const { generateImageSDXL, wait } = Prodia("x-x-x-x-x");

const models = [
  "animagineXLV3_v30.safetensors [75f2f05b]",
  "devlishphotorealism_sdxl15.safetensors [77cba69f]",
  "dreamshaperXL10_alpha2.safetensors [c8afe2ef]",
  "dynavisionXL_0411.safetensors [c39cc051]",
  "juggernautXL_v45.safetensors [e75f5471]",
  "realismEngineSDXL_v10.safetensors [af771c3f]",
  "realvisxlV40.safetensors [f7fdcb51]",
  "sd_xl_base_1.0.safetensors [be9edd61]",
  "sd_xl_base_1.0_inpainting_0.1.safetensors [5679a81a]",
  "turbovisionXL_v431.safetensors [78890989]"
];

module.exports = {
  name: 'prodia',
  description: 'Generate AI art using the Prodia SDXL models.',
  usage: '/prodia <prompt>:<model number>',
  author: 'Your Name',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const userInput = args.join(' ');

    // Split prompt and model number if provided
    let [prompt, modelIndex] = userInput.split(':');
    prompt = prompt ? prompt.trim() : null;

    if (!prompt) {
      const modelsList = models.map((model, index) => `${index}. ${model}`).join('\n');
      return sendMessage(
        senderId, 
        { text: `Please provide a prompt.\n\nUsage: /prodia {prompt}\nExample: /prodia a beautiful landscape\n\nOr specify a model: /prodia {prompt}:{model number}\nExample: /prodia a beautiful landscape:5\n\nModels:\n${modelsList}` },
        pageAccessToken
      );
    }

    // Select random model if not provided
    let model;
    if (modelIndex && !isNaN(parseInt(modelIndex)) && parseInt(modelIndex) >= 0 && parseInt(modelIndex) < models.length) {
      model = models[parseInt(modelIndex)].split(' ')[0]; // Get model name part
    } else {
      model = models[Math.floor(Math.random() * models.length)].split(' ')[0]; // Random model
    }

    // Log prompt and model for debugging
    console.log('Prompt:', prompt);
    console.log('Model:', model);

    try {
      const processingMessage = await sendMessage(senderId, { text: '⚡ Generating your image. Please wait...' }, pageAccessToken);

      const result = await generateImageSDXL({
        prompt: prompt,
        model: model,
        style_preset: "photographic"
      });

      // Log the result to check for issues
      console.log('Generation result:', result);

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
      console.error('Error generating image:', error.message); // Log just the error message for clarity
      sendMessage(senderId, { text: '❌ There was an error generating your image. Please try again later.' }, pageAccessToken);
    }
  }
};
