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

async function sendSenderAction(senderId, pageAccessToken, action, retries = 3) {
  try {
    await sendMessage(senderId, { sender_action: action }, pageAccessToken);
  } catch (error) {
    console.error(`Error sending ${action}:`, error);
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying ${action}... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendSenderAction(senderId, pageAccessToken, action, retries - 1);
    }
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Mark the incoming message as seen immediately
  sendSenderAction(senderId, pageAccessToken, 'mark_seen').catch(error => {
    console.error("Failed to mark seen:", error);
  });

  // Then show typing indicator
  await sendSenderAction(senderId, pageAccessToken, 'typing_on');

  const chatCommand = commands.get('chat');
  if (activeChats.has(senderId)) {
    if (messageText.toLowerCase() === '/quit') {
      await chatCommand.quit(senderId, pageAccessToken, sendMessage);
    } else {
      await chatCommand.routeMessage(senderId, messageText, pageAccessToken, sendMessage);
    }
    await sendSenderAction(senderId, pageAccessToken, 'typing_off');
    return;
  }

  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      await command.execute(senderId, args, pageAccessToken, sendMessage);
      await sendSenderAction(senderId, pageAccessToken, 'typing_off');
      return;
    }
  }

  const aiCommand = commands.get('ai');
  if (gpt.isGptMode(senderId)) {
    await gpt.execute(senderId, [messageText], pageAccessToken, sendMessage);
  } else if (aiCommand) {
    await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
  }

  await sendSenderAction(senderId, pageAccessToken, 'typing_off');
}

module.exports = { handleMessage };
