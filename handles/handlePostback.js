const { sendMessage } = require('./sendMessage');

// Define the URL for following and sharing the page
const PAGE_ID = '303798532824975';  // Replace with your actual Facebook Page ID
const followPageUrl = `https://www.facebook.com/${PAGE_ID}`;
const sharePageUrl = `https://www.facebook.com/sharer/sharer.php?u=https://www.facebook.com/${PAGE_ID}`;

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'ACTIONS') {
    const messageWithButtons = {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'button',
          text: 'Choose an action:',
          buttons: [
            {
              type: 'postback',
              title: 'Follow',
              payload: 'FOLLOW_PAGE'
            },
            {
              type: 'postback',
              title: 'Contact',
              payload: 'CONTACT'
            },
            {
              type: 'postback',
              title: 'Share',
              payload: 'SHARE_PAGE'
            }
          ]
        }
      }
    };

    // Send the message with buttons
    sendMessage(senderId, messageWithButtons, pageAccessToken);

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

  } else if (payload === 'CONTACT') {
    // Handle the help command
    sendMessage(senderId, { text: "You can contact me here: https://www.facebook.com/valneer.2024" }, pageAccessToken);

  } else {
    // Fallback response if payload is not recognized
    sendMessage(senderId, { text: `I'm not sure how to respond to that.` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
