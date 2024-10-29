const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  name: 'sdxl',
  description: 'Generate images using Segmind SDXL1.0 TXT2IMG API.',
  usage: '/sdxl <prompt>',
  author: 'Cruizex',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ').trim();
    
    if (!prompt) {
      return sendMessage(senderId, {
        text: 'Please provide a prompt. Example: /sdxl beautiful landscape',
      }, pageAccessToken);
    }

    try {
      // Inform the user about the process
      await sendMessage(senderId, {
        text: `Generating an image for the prompt: "${prompt}". Please wait...`
      }, pageAccessToken);

      const segmindApiKey = 'SG_b9657f03ca966ed5';

      // Call the Segmind SDXL1.0 API to generate image
      const response = await axios.post(
        'https://api.segmind.com/v1/fast-flux-schnell',
        {
          prompt: prompt,
          negative_prompt: "ugly, tiling, poorly drawn hands, poorly drawn feet, poorly drawn face, out of frame, extra limbs, disfigured, deformed, body out of frame, blurry, bad anatomy, blurred, watermark, grainy, signature, cut off, draft",
          style: "base",
          samples: 1,
          scheduler: "UniPC",
          num_inference_steps: 25,
          guidance_scale: 8,
          strength: 0.2,
          high_noise_fraction: 0.8,
          seed: 468685,
          img_width: 1024,
          img_height: 1024,
          refiner: true,
          base64: false
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': segmindApiKey,
          },
          responseType: 'arraybuffer',
        }
      );

      const imageData = Buffer.from(response.data, 'binary');
      const form = new FormData();
      form.append('recipient', JSON.stringify({ id: senderId }));
      form.append('message', JSON.stringify({
        attachment: {
          type: 'image',
          payload: {
            is_reusable: true
          }
        }
      }));
      form.append('filedata', imageData, {
        filename: 'generated_image.png',
        contentType: 'image/png'
      });

      // Send the image to the user via Messenger
      await axios.post(
        `https://graph.facebook.com/v12.0/me/messages?access_token=${pageAccessToken}`,
        form,
        { headers: form.getHeaders() }
      );

    } catch (error) {
      console.error('Error generating image:', error.message);
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
