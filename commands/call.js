module.exports = {
  name: 'call',
  description: 'Sends a message to the admin or replies to a user',
  usage: '/call <yourmessage>',
  author: 'BIRU',
  execute(senderId, senderName, args, pageAccessToken, sendMessage) {
    if (args.length === 0) {
      return sendMessage(senderId, { text: '⚠️ Please provide a message.' }, pageAccessToken);
    }

    // If sender is admin (admin can reply with "/call <user_id> <message>")
    if (senderId === '100022194825655') { // Replace with admin's Facebook ID
      const userId = args[0]; // First argument is the user ID
      const replyMessage = args.slice(1).join(' '); // Rest is the message

      if (!userId || !replyMessage) {
        return sendMessage(senderId, { text: '⚠️ Please provide a user ID and a message.' }, pageAccessToken);
      }

      // Send reply to the user
      sendMessage(userId, { text: `💬 Admin reply:\n${replyMessage}` }, pageAccessToken);
      sendMessage(senderId, { text: `✅ Your reply has been sent to user (ID: ${userId}).` }, pageAccessToken);
    } else {
      // If sender is a regular user
      const userMessage = args.join(' '); // Combine args to form the message
      const adminId = '100022194825655'; // Replace with your admin's Facebook ID

      // Send the message to the admin with user info
      const messageToAdmin = `📩 Message from user:\n\n🆔 **User ID**: ${senderId}\n✉️ **Message**: ${userMessage}`;
      sendMessage(adminId, { text: messageToAdmin }, pageAccessToken);

      // Notify the user that their message has been sent
      sendMessage(senderId, { text: '✅ Your message has been sent to the admin.' }, pageAccessToken);
    }
  }
};
