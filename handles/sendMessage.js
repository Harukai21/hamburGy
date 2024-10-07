const request = require('request');

function sendTypingIndicator(senderId, pageAccessToken, action) {
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
      console.error('Error sending typing indicator:', error);
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

  // Send typing indicator first
  sendTypingIndicator(senderId, pageAccessToken, 'typing_on');

  // Delay sending the actual message to simulate typing
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

      // Turn off typing indicator after sending the message
      sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
    });
  }, 2000); // 2-second delay to simulate typing
}

module.exports = { sendMessage };
