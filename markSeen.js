// markSeen.js

const axios = require('axios');

async function markSeen(senderId, pageAccessToken, retries = 3) {
  try {
    await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: { id: senderId },
      sender_action: 'mark_seen'
    });
  } catch (error) {
    console.error(`Error marking as seen:`, error);
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying mark_seen... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await markSeen(senderId, pageAccessToken, retries - 1);
    }
  }
}

module.exports = { markSeen };
