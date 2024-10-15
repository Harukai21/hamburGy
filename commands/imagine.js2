const axios = require('axios');

module.exports = {
  name: 'imagine',
  description: 'Generate AI images.',
  usage: '/imagine <prompt>',
  author: 'Biru',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ').trim();
    
    if (!prompt) {
      return sendMessage(senderId, {
        text: 'Please provide a prompt. Example: /imagine pretty girl',
      }, pageAccessToken);
    }

    try {
      // Inform the user about the process
      await sendMessage(senderId, {
        text: `Generating an image for the prompt: "${prompt}". Please wait...`
      }, pageAccessToken);

      // Call the API to generate images
      const response = await axios.get(`https://vneerapi.onrender.com/imagegen?prompt=${encodeURIComponent(prompt)}`);
      
      // Extract only the images array (URLs)
      const { images } = response.data;

      if (images && images.length > 0) {
        // Send the first image
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: images[0], // Send first image
            }
          }
        }, pageAccessToken);

        // Wait 1 second before sending the second image
        setTimeout(async () => {
          if (images[1]) {
            await sendMessage(senderId, {
              attachment: {
                type: 'image',
                payload: {
                  url: images[1], // Send second image
                }
              }
            }, pageAccessToken);
          }
        }, 1000); // 1-second delay before sending the second image

      } else {
        await sendMessage(senderId, {
          text: 'No images were generated. Please try again later.'
        }, pageAccessToken);
      }

    } catch (error) {
      console.error('Error generating image:', error.message);
      await sendMessage(senderId, {
        text: 'An error occurred while generating the image. Please try again later.'
      }, pageAccessToken);
    }
  }
};
