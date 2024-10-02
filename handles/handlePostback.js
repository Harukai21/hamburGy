const { sendMessage } = require('./sendMessage');

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'COMMAND_TOOLS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        {const { sendMessage } = require('./sendMessage');

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'COMMAND_TOOLS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        {
          content_type: 'text',
          title: '/share',
          payload: 'COMMAND_SHARE'
        },
        {
          content_type: 'text',
          title: '/generate',
          payload: 'COMMAND_GENERATE'
        },
        {
          content_type: 'text',
          title: '/lyrics',
          payload: 'COMMAND_LYRICS'
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);
  } else {
    sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  }
}

module.exports = { handlePostback };

          content_type: 'text',
          title: '/share',
          payload: 'COMMAND_SHARE'
        },const { sendMessage } = require('./sendMessage');

function handlePostback(event, pageAccessToken) {
  const senderId = event.sender.id;
  const payload = event.postback.payload;

  if (payload === 'COMMAND_TOOLS') {
    const messageWithQuickReplies = {
      text: 'Choose an action:',
      quick_replies: [
        {
          content_type: 'text',
          title: '/share',
          payload: 'COMMAND_SHARE'
        },
        {
          content_type: 'text',
          title: '/generate',
          payload: 'COMMAND_GENERATE'
        },
        {
          content_type: 'text',
          title: '/lyrics',
          payload: 'COMMAND_LYRICS'
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);
  } else {
    sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  }
}

module.exports = { handlePostback };

        {
          content_type: 'text',
          title: '/generate',
          payload: 'COMMAND_GENERATE'
        },
        {
          content_type: 'text',
          title: '/lyrics',
          payload: 'COMMAND_LYRICS'
        }
      ]
    };

    // Send the message with quick replies
    sendMessage(senderId, messageWithQuickReplies, pageAccessToken);
  } else {
    sendMessage(senderId, { text: `You sent a postback with payload: ${payload}` }, pageAccessToken);
  }
}

module.exports = { handlePostback };
