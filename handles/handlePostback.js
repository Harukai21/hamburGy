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
          payload: 'see the commands'
        },
        {
          content_type: 'text',
          title: '/follow',
          payload: 'follow the page'
        },
        {
          content_type: 'text',
          title: '/share',
          payload: 'share to other users'
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);
  
  } else if (payload === 'follow the page') {
    // Send a message with the follow page link
    const followMessage = {
      text: `You can follow our page here: ${followPageUrl}`
    };
    sendMessage(senderId, followMessage, pageAccessToken);

  } else if (payload === 'share to other users') {
    // Send a message with the share link
    const shareMessage = {
      text: `Share our page with your friends: ${sharePageUrl}`
    };
    sendMessage(senderId, shareMessage, pageAccessToken);

  } else {
    sendMessage(senderId, { text: `I'm not sure how to respond to that.` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
