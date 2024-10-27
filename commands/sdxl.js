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
      console.log(`Processing prompt: "${prompt}" for sender: ${senderId}`);
      
      await sendMessage(senderId, {
        text: `Generating an image for the prompt: "${prompt}". Please wait...`
      }, pageAccessToken);

      const segmindApiKey = 'SG_b9657f03ca966ed5';
      const cacheDirectory = path.join(__dirname, 'cache');
      await fs.ensureDir(cacheDirectory);

      // Log Segmind API request setup
      console.log('Calling Segmind SDXL1.0 API with prompt:', prompt);
      
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

      console.log('Segmind API response status:', response.status);
      if (response.status !== 200) {
        console.error('Segmind API error:', response.data);
      }

      const imageData = Buffer.from(response.data, 'binary');
      const outputFileName = path.join(cacheDirectory, 'generated_image.png');
      await fs.writeFile(outputFileName, imageData);

      // Prepare file upload form data
      console.log('Preparing image upload to Facebook API...');
      const formData = new FormData();
      formData.append('filedata', fs.createReadStream(outputFileName));
      formData.append('access_token', pageAccessToken);

      // Upload image to Facebook Attachment API
      console.log('Uploading image to Facebook Attachment API...');
      const uploadResponse = await axios.post(
        `https://graph.facebook.com/v20.0/me/message_attachments`,
        formData,
        { headers: formData.getHeaders() }
      );

      console.log('Facebook upload response status:', uploadResponse.status);
      if (uploadResponse.status !== 200) {
        console.error('Facebook upload error:', uploadResponse.data);
      }

      const attachmentId = uploadResponse.data.attachment_id;
      console.log('Image uploaded successfully, attachment ID:', attachmentId);

      // Send image to the user
      console.log('Sending image to the user...');
      await sendMessage(senderId, {
        attachment: {
          type: 'image',
          payload: {
            attachment_id: attachmentId
          }
        }
      }, pageAccessToken);

      console.log('Image sent successfully.');

      // Clean up the cache directory
      await fs.remove(outputFileName);
      console.log('Temporary image file removed.');

    } catch (error) {
      console.error('Error generating image:', error.message, '\nFull error:', error);
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
