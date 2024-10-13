const request = require('request');

function sendAction(senderId, pageAccessToken, action) {
  const payload = {
    recipient: { id: senderId },
    sender_action: action
  };

  request({
    url: 'https://graph.facebook.com/v13.0/me/messages',
    qs: { access_token: pageAccessToken },
    method: 'POST',
    json: payload,
  }, (error, response, body) => {
    if (error) {
      console.error(`Error sending ${action}:`, error);
    } else if (response.body.error) {
      console.error('Error response:', response.body.error);
    } else {
      console.log(`${action} action sent successfully`);
    }
  });
}

function sendMessage(senderId, message, pageAccessToken) {
  if (!message || (!message.text && !message.attachment && !message.quick_replies)) {
    console.error('Error: Message must provide valid text, attachment, or quick replies.');
    return;
  }

  const payload = {
    recipient: { id: senderId },
    message: {}
  };

  if (message.text) {
    payload.message.text = message.text;
  }

  if (message.attachment) {
    payload.message.attachment = message.attachment;
  }

  if (message.quick_replies) {
    payload.message.quick_replies = message.quick_replies;
  }

  // 1. Mark the message as "seen" immediately
  sendAction(senderId, pageAccessToken, 'mark_seen');

  // 2. Send typing indicator immediately after receiving the message
  sendAction(senderId, pageAccessToken, 'typing_on');

  // 3. Delay sending the actual message to simulate typing
  setTimeout(() => {
    request({
      url: 'https://graph.facebook.com/v13.0/me/messages',
      qs: { access_token: pageAccessToken },
      method: 'POST',
      json: payload,
    }, (error, response, body) => {
      if (error) {
        console.error('Error sending message:', error);
      } else if (response.body.error) {
        console.error('Error response:', response.body.error);
      } else {
        console.log('Message sent successfully:', body);
      }

      // 4. Turn off typing indicator after sending the message
      sendAction(senderId, pageAccessToken, 'typing_off');
    });
  }, 0000); // 2-second delay to simulate typing
}

module.exports = { sendMessage };
