const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');
const { activeChats } = require('../commands/chat');
const { execute: aiExecute } = require('../commands/ai'); // AI command handler

const commands = new Map();
const prefix = '/';

const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command);
}

const userSpamData = new Map();

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
  const currentTime = Date.now();

  // Check if the user is blocked and skip handling if within the blocked period
  if (userSpamData.has(senderId) && userSpamData.get(senderId).blockedUntil) {
    if (currentTime < userSpamData.get(senderId).blockedUntil) {
      console.log(`Ignoring message from ${senderId} as they are currently blocked.`);
      return; // Skip message handling for blocked users
    } else {
      userSpamData.delete(senderId);
      console.log(`User ${senderId} has been unblocked.`);
    }
  }

  // Set typing indicator
  await setTypingIndicator(senderId, pageAccessToken, 'typing_on');

  if (event.message.attachments) {
    const attachments = event.message.attachments;
    const imageUrls = [];

    for (const attachment of attachments) {
      switch (attachment.type) {
        case 'image':
          const imageUrl = attachment.payload.url;
          console.log(`Image received: ${imageUrl}`);
          if (imageUrl.includes('t39.1997-6')) {
            console.log('Thumbs-up emoji detected, ignoring image.');
            break; 
          }
          imageUrls.push(imageUrl);
          break;

        case 'video':
          console.log(`Video received: ${attachment.payload.url}`);
          break;

        case 'audio':
          console.log(`Audio received: ${attachment.payload.url}`);
          break;

        case 'file':
          const fileUrl = attachment.payload.url;
          console.log(`File received: ${fileUrl}`);
          await setTypingIndicator(senderId, pageAccessToken, 'typing_on');
          await aiExecute(senderId, `process_file:${fileUrl}`, pageAccessToken, sendMessage);
          await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
          break;

        case 'location':
          const { lat, long } = attachment.payload.coordinates;
          console.log(`Location received: Latitude ${lat}, Longitude ${long}`);
          break;

        default:
          console.log(`Unknown attachment type received: ${attachment.type}`);
      }
    }

    if (imageUrls.length > 0) {
      await setTypingIndicator(senderId, pageAccessToken, 'typing_on');
      await aiExecute(senderId, `recognize_images:${JSON.stringify(imageUrls)}`, pageAccessToken, sendMessage);
      await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
    }
    await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
    return; 
  }

  if (event.message.text) {
    const messageText = event.message.text.trim();
    
    // Initialize or update spam data for the user
    if (!userSpamData.has(senderId)) {
      userSpamData.set(senderId, { count: 0, firstMessageTime: currentTime, warned: false, lastMessageTime: currentTime });
    }

    const userData = userSpamData.get(senderId);
    if (currentTime - userData.lastMessageTime < 2000) {
      userData.count++;
    } else {
      userData.count = 1;
    }

    userData.lastMessageTime = currentTime;

    if (currentTime - userData.firstMessageTime > 12000) {
      userData.count = 1;
      userData.firstMessageTime = currentTime;
      userData.warned = false;
    }

    if (userData.count >= 8) {
      if (!userData.warned) {
        await sendMessage(senderId, { text: "Warning: Do not spam or you'll be blocked for 30 minutes." }, pageAccessToken);
        userData.warned = true;
      } else {
        userData.blockedUntil = currentTime + 30 * 60 * 1000;
        console.log(`User ${senderId} has been temporarily blocked for 30 minutes.`);
        return;
      }
    }

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
          text: `The command "${messageText}" does not exist. Please type /help to see the list of commands.` 
        }, pageAccessToken);
      }
    } else {
      const commandName = messageText.toLowerCase().split(/\s+/)[0];
      if (commands.has(commandName)) {
        await sendMessage(senderId, { 
          text: `This command needs a prefix. Please use "${prefix}${commandName}".` 
        }, pageAccessToken);
      } else {
        const aiCommand = commands.get('ai');
        if (aiCommand) {
          await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
        }
      }
    }
  }

  await setTypingIndicator(senderId, pageAccessToken, 'typing_off');
}

module.exports = { handleMessage };
