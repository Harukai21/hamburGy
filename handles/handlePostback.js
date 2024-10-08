const { sendMessage } = require('./sendMessage');
const playCommand = require('../commands/play');  // Import the play command (formerly sing)

// Define the URL for following and sharing the page
const PAGE_ID = '303798532824975';  // Replace with your actual Facebook Page ID
const followPageUrl = `https://www.facebook.com/${PAGE_ID}`;
const sharePageUrl = `https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/${PAGE_ID}`;

async function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'ACTIONS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        {
          content_type: 'text',
          title: '/help',
          payload: 'HELP'
        },
        {
          content_type: 'text',
          title: '/follow',
          payload: 'FOLLOW_PAGE'
        },
        {
          content_type: 'text',
          title: '/share',
          payload: 'SHARE_PAGE'
        }
      ]
    };

    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);

  } else if (payload === 'FOLLOW_PAGE') {
    const followMessage = { text: `You can follow our page here: ${followPageUrl}` };
    sendMessage(senderId, followMessage, pageAccessToken);

  } else if (payload === 'SHARE_PAGE') {
    const shareMessage = { text: `Share our page with your friends: ${sharePageUrl}` };
    sendMessage(senderId, shareMessage, pageAccessToken);

  } else if (payload === 'HELP') {
    sendMessage(senderId, { text: "Here are some commands you can use: /help, /follow, /share" }, pageAccessToken);

  } else if (payload.startsWith('/')) {
    // Handle the video selection when the user types /1, /2, or /3
    await playCommand.handleSelection(senderId, payload, pageAccessToken, sendMessage);

  } else {
    sendMessage(senderId, { text: `I'm not sure how to respond to that.` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
