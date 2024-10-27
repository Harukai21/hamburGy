const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
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
      const cacheDirectory = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDirectory);

      // Call the Segmind SDXL1.0 API to generate image
      const response = await axios.post(
        'https://api.segmind.com/v1/sdxl1.0-txt2img',
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
      const outputFileName = path.join(cacheDirectory, 'generated_image.png');
      await fs.writeFile(outputFileName, imageData);

      // Upload the image to Facebook's Attachment Upload API
      const formData = new FormData();
      formData.append('message', fs.createReadStream(outputFileName));
      formData.append('access_token', pageAccessToken);

      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v21.0/me/message_attachments?access_token=${pageAccessToken}`,
        formData,
        { headers: formData.getHeaders() }
      );

      const attachmentId = uploadResponse.data.attachment_id;

      // Send the generated image to the user
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            attachment_id: attachmentId
          }
        }
      }, pageAccessToken);

      // Clean up the cache directory
      await fs.remove(outputFileName);

    } catch (error) {
      console.error('Error generating image:', error.message);
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
