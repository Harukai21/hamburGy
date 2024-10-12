const { Prodia } = require("prodia.js");
const { generateImageSDXL, wait, getSDXLModels } = Prodia("eaca0864-70a4-4653-8dc7-f5ba3918326f");

module.exports = {
  name: 'prodia',
  description: 'Generate AI images with Prodia.',
  usage: '/prodia <prompt>[:<model number>]',
  author: 'Biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
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

    let prompt = args.join(' ');
    let model = models[7].split(' ')[1]; // Default model: sd_xl_base_1.0

    if (prompt.includes(':')) {
      const parts = prompt.split(':');
      prompt = parts[0].trim();

      const modelNumber = parseInt(parts[1].trim());
      if (!isNaN(modelNumber) && modelNumber >= 0 && modelNumber < models.length) {
        model = models[modelNumber].split(' ')[1];
      } else {
        return sendMessage(senderId, { text: '❗ Invalid model number. Use a number between 0 and 9.' }, pageAccessToken);
      }
    } else if (!prompt) {
      const modelList = models.map((model) => `${model}`).join('\n');
      return sendMessage(
        senderId,
        { text: `Please provide a prompt.\nAvailable models:\n\n${modelList}` },
        pageAccessToken
      );
    }

    try {
      const result = await generateImageSDXL({
        prompt: prompt,
        model: model,
        style_preset: 'photographic',
      });

      const imageUrl = await wait(result);

      // Send image without any additional text
      sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            url: imageUrl,
            is_reusable: true,
          }
        }
      }, pageAccessToken);

    } catch (error) {
      console.error('Error generating image:', error);
      sendMessage(senderId, { text: '❌ There was an error generating your image. Please try again later.' }, pageAccessToken);
    }
  }
};
