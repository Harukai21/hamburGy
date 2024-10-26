// handleMessage.js

const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { activeChats } = require('../commands/chat');
const gpt = require('../commands/gpt'); // Import GPT command

const commands = new Map();
const prefix = '/';

const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command);
}

// Function specifically for marking a message as seen
async function markSeen(senderId, pageAccessToken, retries = 3) {
  try {
    await sendMessage(senderId, { sender_action: 'mark_seen' }, pageAccessToken);
  } catch (error) {
    console.error(`Error marking as seen:`, error);
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying mark_seen... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await markSeen(senderId, pageAccessToken, retries - 1);
    }
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Trigger markSeen independently, so it's not dependent on other actions
  markSeen(senderId, pageAccessToken).catch(error => console.error("Failed to mark seen:", error));

  const chatCommand = commands.get('chat');
  if (activeChats.has(senderId)) {
    if (messageText.toLowerCase() === '/quit') {
      await chatCommand.quit(senderId, pageAccessToken, sendMessage);
    } else {
      await chatCommand.routeMessage(senderId, messageText, pageAccessToken, sendMessage);
    }
    return;
  }

  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      await command.execute(senderId, args, pageAccessToken, sendMessage);
      return;
    }
  }

  const aiCommand = commands.get('ai');
  if (gpt.isGptMode(senderId)) {
    await gpt.execute(senderId, [messageText], pageAccessToken, sendMessage);
  } else if (aiCommand) {
    await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
  }
}

module.exports = { handleMessage };
