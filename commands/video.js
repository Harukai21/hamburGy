const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'Video',
  description: 'Fetch image and video search',
  author: 'Aljur Pogoy',
  usage: '/video <query>'
    
  async execute(senderId, args, pageAccessToken) {
    const query = args.join(' ');

    if (!query) {
      return sendMessage(senderId, { text: 'Veuillez entrer un terme de recherche.' }, pageAccessToken);
    }

    try {
      const response = await axios.get(`https://me0xn4hy3i.execute-api.us-east-1.amazonaws.com/staging/api/resolve/resolveYoutubeSearch?search=${encodeURIComponent(query)}`);
      const videos = response.data.data;

      if (!videos || videos.length === 0) {
        return sendMessage(senderId, { text: 'Aucune vidéo trouvée.' }, pageAccessToken);
      }

      // Limiter le nombre de vidéos à 10
      const limitedVideos = videos.slice(0, 10);
      
      const videoMessages = limitedVideos.map(video => ({
        title: video.title,
        buttons: [
          {
            type: 'postback',
            title: 'Regarder',
            payload: `WATCH_${video.videoId}`
          },
          {
            type: 'postback',
            title: 'Télécharger',
            payload: `DOWNLOAD_${video.videoId}`
          }
        ],
        image: video.imgSrc,
        text: `Durée: ${video.duration}\nVues: ${video.views}`
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
      sendMessage(senderId, { text: 'Erreur lors de la recherche des vidéos.' }, pageAccessToken);
    }
  },
  async handlePostback(senderId, payload, pageAccessToken) {
    const [action, videoId] = payload.split('_');

    if (action === 'WATCH') {
      // Logique pour envoyer la vidéo
      const videoUrl = `https://example.com/videos/${videoId}.mp4`; // Remplacez par l'URL réelle
      sendMessage(senderId, {
        attachment: {
          type: 'video',
          payload: {
            url: videoUrl
          }
        }
      }, pageAccessToken);
    } else if (action === 'DOWNLOAD') {
      // Logique pour envoyer le fichier .mp4
      const videoFilePath = `path/to/videos/${videoId}.mp4`; // Remplacez par le chemin réel
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
