const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'babe',
  description: 'Interact with Jea AI, the personal AI Girlfriend',
  usage: "/babe hi",
  author: 'Biru',
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');

    if (!prompt) {
      return sendMessage(senderId, { text: 'Please provide a prompt, for example: jea How are you?' }, pageAccessToken);
    }

    const headers = {
      "Content-Type": "application/json",
      "Origin": "https://www.blackbox.ai",
      "Referer": "https://www.blackbox.ai/agent/BabeOB4l1nK",
      "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36"
    };

    const config = {
      "messages": [{
        "id": "SVNaDhsdI_FlPHGFGlDyB",
        "content": `${prompt}`,
        "role": "user"
      }],
      "id": "SVNaDhsdI_FlPHGFGlDyB",
      "previewToken": null,
      "userId": null,
      "codeModelMode": true,
      "agentMode": {
        "mode": true,
        "id": "BabeOB4l1nK",
        "name": "Babe"
      },
      "trendingAgentMode": {},
      "isMicMode": false,
      "maxTokens": 1024,
      "isChromeExt": false,
      "githubToken": null,
      "clickedAnswer2": false,
      "clickedAnswer3": false,
      "clickedForceWebSearch": false,
      "visitFromDelta": false,
      "mobileClient": false,
      "withCredentials": true
    };

    const apiUrl = 'https://www.blackbox.ai/api/chat';

    try {
      const response = await axios.post(apiUrl, config, { headers });
      const jeaResponse = response.data.replace(/\**/g, '').replace(/^\$@\$.*?\$@\$/g, '') || 'No response from Jea.';

      const formattedResponse = 
`BABE 🖤\n\n${jeaResponse}`;

      await sendMessage(senderId, { text: formattedResponse }, pageAccessToken);

    } catch (error) {
      console.error('Error:', error);

      await sendMessage(senderId, { text: '❌ An error occurred. Please try again later.' }, pageAccessToken);
    }
  }
};
