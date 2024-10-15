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
      
      await sendMessage(senderId, {
        text: `Generating an image for the prompt: "${prompt}". Please wait...`
      }, pageAccessToken);

      
      const response = await axios.get(`https://vneerapi.onrender.com/imagegen?prompt=${encodeURIComponent(prompt)}`);
      const { images } = response.data;

      if (images && images.length > 0) {
        
        await sendMessage(senderId, {
          attachment: {
            type: 'image',
            payload: {
              url: images[0], // Send first image
              is_reusable: true
            }
          }
        }, pageAccessToken);

        
        setTimeout(async () => {
          if (images[1]) {
            await sendMessage(senderId, {
              attachment: {
                type: 'image',
                payload: {
                  url: images[1], 
                  is_reusable: true
                }
              }
            }, pageAccessToken);
          }
        }, 1000); // 1-sec

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
