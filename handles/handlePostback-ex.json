const { sendMessage } = require('./sendMessage');

// Define the URL for following and sharing the page
const PAGE_ID = '303798532824975';  // Replace with your actual Facebook Page ID
const followPageUrl = `https://www.facebook.com/${PAGE_ID}`;
const sharePageUrl = `https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/${PAGE_ID}`;

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'ACTIONS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        {
          content_type: 'text',
          title: '/help',
          payload: 'HELP'  // Use a unique identifier
        },
        {
          content_type: 'text',
          title: '/follow',
          payload: 'FOLLOW_PAGE'  // Use a unique identifier
        },
        {
          content_type: 'text',
          title: '/share',
          payload: 'SHARE_PAGE'  // Use a unique identifier
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);

  } else if (payload === 'FOLLOW_PAGE') {
    // Send a message with the follow page link
    const followMessage = {
      text: `You can follow our page here: ${followPageUrl}`
    };
    sendMessage(senderId, followMessage, pageAccessToken);

  } else if (payload === 'SHARE_PAGE') {
    // Send a message with the share link
    const shareMessage = {
      text: `Share our page with your friends: ${sharePageUrl}`
    };
    sendMessage(senderId, shareMessage, pageAccessToken);

  } else if (payload === 'HELP') {
    // Handle the help command
    sendMessage(senderId, { text: "Here are some commands you can use: /help, /follow, /share" }, pageAccessToken);

  } else {
    // Fallback response if payload is not recognized
    sendMessage(senderId, { text: `I'm not sure how to respond to that.` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
