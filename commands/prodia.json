const axios = require('axios');
const { Prodia } = require("prodia.js");
const { generateImageSDXL, wait } = Prodia("eaca0864-70a4-4653-8dc7-f5ba3918326f");

module.exports = {
  name: 'prodia',
  description: 'Generate AI art using the Prodia SDXL models.',
  usage: '/prodia <prompt>:<model number>',
  author: 'Your Name',

  async getSDXLModels() {
    try {
      const response = await axios.get('https://api.prodia.com/v1/sdxl/models', {
        headers: {
          accept: 'application/json',
          'X-Prodia-Key': 'eaca0864-70a4-4653-8dc7-f5ba3918326f'
        }
      });
      return response.data; // Returns an array of models
    } catch (error) {
      console.error('Error fetching models:', error.message);
      return null;
    }
  },

  // Function to poll for the job status until it completes
  async pollJobStatus(jobId) {
    const maxRetries = 10;
    const delay = 3000; // 3 seconds between each poll
    let retries = 0;

    while (retries < maxRetries) {
      retries += 1;
      try {
        const result = await axios.get(`https://api.prodia.com/v1/job/${jobId}`, {
          headers: {
            accept: 'application/json',
            'X-Prodia-Key': 'eaca0864-70a4-4653-8dc7-f5ba3918326f'
          }
        });

        // Check if the job is completed and return the result if ready
        if (result.data.status === 'completed' && result.data.output) {
          return result.data.output; // This should contain the image URL
        }

        console.log(`Job status: ${result.data.status}. Retrying... (${retries}/${maxRetries})`);

        // Wait before checking again
        await new Promise(resolve => setTimeout(resolve, delay));
      } catch (error) {
        console.error('Error polling job status:', error.message);
      }
    }

    throw new Error('Image generation timed out. Please try again later.');
  },

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
      const models = await this.getSDXLModels(); // Fetching available models dynamically

      if (!models || models.length === 0) {
        return sendMessage(senderId, { text: '❌ No available models found. Please try again later.' }, pageAccessToken);
      }

      let model;
      if (modelIndex && !isNaN(parseInt(modelIndex)) && parseInt(modelIndex) >= 0 && parseInt(modelIndex) < models.length) {
        model = models[parseInt(modelIndex)]; // Use the model name based on the provided index
      } else {
        model = models[Math.floor(Math.random() * models.length)]; // Randomly select a model
      }

      // Log the selected model and prompt for debugging
      console.log('Prompt:', prompt);
      console.log('Selected Model:', model);

      // Define style presets
      const stylePresets = [
        "3d-model", "analog-film", "anime", "cinematic", "comic-book", "digital-art",
        "enhance", "fantasy-art", "isometric", "line-art", "low-poly", "neon-punk", 
        "origami", "photographic", "pixel-art", "texture", "craft-clay"
      ];

      // Randomly select a style preset
      const stylePreset = stylePresets[Math.floor(Math.random() * stylePresets.length)];

      // Inform the user that the image is being generated
      await sendMessage(senderId, { text: '⚡ Generating your image using the style: ' + stylePreset + '. Please wait...' }, pageAccessToken);

      // Log what is being sent to Prodia
      console.log('Sending to Prodia - Prompt:', prompt, ', Model:', model, ', Style:', stylePreset);

      // Generate the image with the selected model and style
      const result = await generateImageSDXL({
        prompt: prompt,
        model: model,
        style_preset: stylePreset // Use the randomly selected style preset
      });

      // Log the raw response from Prodia
      console.log('Prodia Response:', result);

      if (!result.job) {
        throw new Error('No job ID received from Prodia. Something went wrong.');
      }

      // Poll the job status until it's complete and we get the image URL
      const imageUrl = await this.pollJobStatus(result.job);

      // Debugging: Log the generated image URL
      console.log('Generated Image URL:', imageUrl);

      if (!imageUrl) {
        return sendMessage(senderId, { text: '❌ Error generating image URL. Please try again later.' }, pageAccessToken);
      }

      // Send the image separately from the text
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
