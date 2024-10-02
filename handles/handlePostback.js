const { sendMessage } = require('./sendMessage');

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'COMMANDS') {
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
          title: 'ai',
          payload: 'listens to incoming messages'
        },
        {
          content_type: 'text',
          title: '/lyrics',
          payload: 'search for song lyrics'
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);
  } else {
    sendMessage(senderId, { text: `` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
