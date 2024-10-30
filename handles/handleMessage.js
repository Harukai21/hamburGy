const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { activeChats } = require('../commands/chat');

const commands = new Map();
const prefix = '/';

const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command);
}

// Replacing sendSenderAction with setTypingIndicator
async function setTypingIndicator(senderId, pageAccessToken, action = 'typing_on', retries = 3) {
  try {
    await axios.post(`https://graph.facebook.com/v21.0/me/messages?access_token=${pageAccessToken}`, {
      recipient: { id: senderId },
      sender_action: action
    });
  } catch (error) {
    console.error(`Error setting typing indicator to ${action}:`, error);
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying ${action}... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await setTypingIndicator(senderId, pageAccessToken, action, retries - 1);
    }
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Only typing indicator, mark_seen is removed
  await setTypingIndicator(senderId, pageAccessToken, 'typing_on');

  const chatCommand = commands.get('chat');
  if (activeChats.has(senderId)) {
    if (messageText.toLowerCase() === '/quit') {
      await chatCommand.quit(senderId, pageAccessToken, sendMessage);
    } else {
      await chatCommand.routeMessage(senderId, messageText, pageAccessToken, sendMessage);
    }
    await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
    return;
  }

  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(/\s+/);
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      await command.execute(senderId, args, pageAccessToken, sendMessage);
    } else if (commandName !== 'no') {
      await sendMessage(senderId, { 
        text: `𝖳𝗁𝖾 𝖼𝗈𝗆𝗆𝖺𝗇𝖽 "${messageText}" 𝖽𝗈e𝗌 𝗇𝗈𝗍 𝖾𝗑𝗂𝗌𝗍. 𝖯𝗅𝖾𝖺𝗌𝖾 𝗍𝗒𝗉𝖾 /𝗁𝖾𝗅𝗉 𝗍𝗈 𝗌𝖾𝖾 𝗍𝗁𝖾 𝗅𝗂𝗌𝗍 𝗈𝖿 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌.` 
      }, pageAccessToken);
   
      await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
      return; 
    }
  } else {
    // Continue AI response only if no command prefix is used and no active chat
    const aiCommand = commands.get('ai');
    if (aiCommand) {
      await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
    }
  }

  await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
}

module.exports = { handleMessage };
