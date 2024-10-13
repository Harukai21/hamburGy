const { sendMessage } = require('./sendMessage');
const playCommand = require('../commands/play');  // Updated to point to 'play' command

// Define the URL for following and sharing the page
const PAGE_ID = '303798532824975';  // Replace with your actual Facebook Page ID
const followPageUrl = `https://www.facebook.com/${PAGE_ID}`;
const sharePageUrl = `https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/${PAGE_ID}`;

async function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  try {
    const parsedPayload = JSON.parse(payload);

    // If the payload is related to the play command (video selection)
    if (parsedPayload.action === 'select_video') {
      // Pass the payload to the play command's handlePostback to download the song
      await playCommand.handlePostback(senderId, payload, pageAccessToken, sendMessage);
      return;
    }
  } catch (e) {
    console.error("Error parsing payload:", e);
  }

  // Handle other actions (e.g., help, follow, etc.)
  if (payload === 'ACTIONS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        { content_type: 'text', title: '/help', payload: 'HELP' },
        { content_type: 'text', title: '/follow', payload: 'FOLLOW_PAGE' },
        { content_type: 'text', title: '/share', payload: 'SHARE_PAGE' }
      ]
    };
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);

  } else if (payload === 'FOLLOW_PAGE') {
    sendMessage(senderId, { text: `You can follow our page here: ${followPageUrl}` }, pageAccessToken);

  } else if (payload === 'SHARE_PAGE') {
    sendMessage(senderId, { text: `Share our page with your friends: ${sharePageUrl}` }, pageAccessToken);

  } else if (payload === 'HELP') {
    sendMessage(senderId, { text: "Here are some commands you can use: /help, /follow, /share" }, pageAccessToken);

  } else {
    // Fallback response for unknown payloads
    sendMessage(senderId, { text: `I'm not sure how to respond to that.` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
