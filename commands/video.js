const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'Video',
  description: 'Fetch and search for videos or images',
  author: 'Aljur Pogoy',
  usage: '/video title',
  
  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ');

    if (!query) {
      return sendMessage(senderId, { text: 'Please enter a search term.' }, pageAccessToken);
    }

    try {
      const response = await axios.get(`https://me0xn4hy3i.execute-api.us-east-1.amazonaws.com/staging/api/resolve/resolveYoutubeSearch?search=${encodeURIComponent(query)}`);
      const videos = response.data.data;

      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: 'No videos found.' }, pageAccessToken);
      }

      // Limit the number of videos to 10
      const limitedVideos = videos.slice(0, 10);
      
      const videoMessages = limitedVideos.map(video => ({
        title: video.title,
        buttons: [
          {
            type: 'postback',
            title: 'Watch',
            payload: `WATCH_${video.videoId}`
          },
          {
            type: 'postback',
            title: 'Download',
            payload: `DOWNLOAD_${video.videoId}`
          }
        ],
        image: video.imgSrc,
        text: `Duration: ${video.duration}\nViews: ${video.views}`
      }));

      const message = videoMessages.map(video => ({
        title: video.title,
        image_url: video.image,
        subtitle: video.text,
        buttons: video.buttons
      }));

      sendMessage(senderId, {
        attachment: {
          type: 'template',
          payload: {
            template_type: 'generic',
            elements: message
          }
        }
      }, pageAccessToken);
      
    } catch (error) {
      console.error('Error fetching video data:', error);
      sendMessage(senderId, { text: 'An error occurred while searching for videos.' }, pageAccessToken);
    }
  },
  async handlePostback(senderId, payload, pageAccessToken) {
    const [action, videoId] = payload.split('_');

    if (action === 'WATCH') {
      // Logic to send the video
      const videoUrl = `https://example.com/videos/${videoId}.mp4`; // Replace with the actual URL
      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: videoUrl
          }
        }
      }, pageAccessToken);
    } else if (action === 'DOWNLOAD') {
      // Logic to send the .mp4 file
      const videoFilePath = `path/to/videos/${videoId}.mp4`; // Replace with the actual path
      sendMessage(senderId, {
        attachment: {
          type: 'file',
          payload: {
            url: videoFilePath,
            is_reusable: true
          }
        }
      }, pageAccessToken);
    }
  }
};
