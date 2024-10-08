const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage');

const commands = new Map();
const prefix = '/'; // Set your desired prefix

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command); // Ensure command names are stored in lowercase
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;

  // Ensure event.message exists before accessing its properties
  if (!event.message) {
    console.error('No message found in event:', event);
    return;
  }

  // Safely handle both text and attachments
  const messageText = event.message.text && typeof event.message.text === 'string' ? event.message.text.trim() : null;
  const attachments = event.message.attachments || []; // Default to an empty array if no attachments

  if (messageText) {
    // Check if the message starts with the command prefix
    if (messageText.startsWith(prefix)) {
      const args = messageText.slice(prefix.length).split(' ');
      const commandName = args.shift().toLowerCase();

      if (commands.has(commandName)) {
        const command = commands.get(commandName);
        try {
          await command.execute(senderId, args, pageAccessToken, sendMessage);
        } catch (error) {
          console.error(`Error executing command ${commandName}:`, error);
          sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
        }
      }
      return; // Exit after handling a command with the prefix
    }

    // If the message doesn't start with the prefix, handle it as "Ai" by default
    const aiCommand = commands.get('ai');
    if (aiCommand) {
      try {
        await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
      } catch (error) {
        console.error('Error executing Ai command:', error);
        sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
      }
    }
  } else if (attachments.length > 0) {
    // Handle attachments (e.g., images)
    const aiCommand = commands.get('ai');
    if (aiCommand) {
      try {
        const attachment = attachments[0]; // Handle the first attachment only
        const messageType = attachment.type || 'attachment'; // Get attachment type

        if (messageType === 'image') {
          // Handle only images
          await aiCommand.execute(senderId, '', pageAccessToken, sendMessage, 'image', attachment);
        } else {
          sendMessage(senderId, { text: 'Unsupported attachment type. Please send an image.' }, pageAccessToken);
        }
      } catch (error) {
        console.error('Error processing attachment:', error);
        sendMessage(senderId, { text: 'There was an error processing your attachment.' }, pageAccessToken);
      }
    }
  } else {
    console.log('No text or attachments found in the event');
  }
}

module.exports = { handleMessage };
