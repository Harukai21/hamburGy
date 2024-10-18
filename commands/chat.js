let chatQueue = []; // Queue to store users looking for a chat
let activeChats = new Map(); // Map to store active chat pairs

module.exports = {
  name: 'chat',
  description: 'Find a chatmate and start chatting with another user',
  usage: '/chat',
  author: 'System',
  
  async execute(senderId, args, pageAccessToken, sendMessage) {
    // Check if the user is already in the chat queue
    if (chatQueue.includes(senderId)) {
      return sendMessage(senderId, { text: 'You are already in the queue, please wait for a chatmate.' }, pageAccessToken);
    }

    // Check if the user is already in an active chat
    if (activeChats.has(senderId)) {
      return sendMessage(senderId, { text: 'You are already in an active chat!' }, pageAccessToken);
    }

    // If the queue is empty, add the user to the queue
    if (chatQueue.length === 0) {
      chatQueue.push(senderId);
      return sendMessage(senderId, { text: 'Searching for a chatmate... Please wait.' }, pageAccessToken);
    }

    // If there is a user in the queue, pair them up
    const chatmateId = chatQueue.shift(); // Remove the first user from the queue

    // Pair the users
    activeChats.set(senderId, chatmateId);
    activeChats.set(chatmateId, senderId);

    // Notify both users
    await sendMessage(senderId, { text: `🎉 You have been paired with your chatmate! Say hi! Type "/quit" to leave the chat.` }, pageAccessToken);
    await sendMessage(chatmateId, { text: `🎉 You have been paired with your chatmate! Say hi! Type "/quit" to leave the chat.` }, pageAccessToken);
  },

  // Handle when a user wants to quit the chat
  async quit(senderId, pageAccessToken, sendMessage) {
    if (!activeChats.has(senderId)) {
      return sendMessage(senderId, { text: 'You are not currently in a chat.' }, pageAccessToken);
    }

    const chatmateId = activeChats.get(senderId);

    // Notify both users that the chat is ending
    await sendMessage(senderId, { text: 'You have left the chat.' }, pageAccessToken);
    await sendMessage(chatmateId, { text: 'Your chatmate has left the chat.' }, pageAccessToken);

    // Remove both users from activeChats
    activeChats.delete(senderId);
    activeChats.delete(chatmateId);
  },

  // Function to route messages between users
  async routeMessage(senderId, message, pageAccessToken, sendMessage) {
    if (!activeChats.has(senderId)) {
      return sendMessage(senderId, { text: 'You are not in an active chat!' }, pageAccessToken);
    }

    const chatmateId = activeChats.get(senderId);
    await sendMessage(chatmateId, { text: message }, pageAccessToken);
  },

  // Export the activeChats and chatQueue for external access
  activeChats,
  chatQueue
};
