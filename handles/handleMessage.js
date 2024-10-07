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
  const messageText = event.message && event.message.text ? event.message.text.trim() : null; // Ensure message exists before accessing text
  const attachments = event.message && event.message.attachments ? event.message.attachments : [];

  // If there's an attachment, handle it as an image or other file type
  if (attachments.length > 0) {
    const attachment = attachments[0]; // Handling the first attachment, you can expand this for multiple
    const aiCommand = commands.get('ai');
    if (aiCommand) {
      try {
        await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage, 'image', attachment); // 'image' can be replaced with dynamic type checking
      } catch (error) {
        console.error('Error executing Ai command with attachment:', error);
        sendMessage(senderId, { text: 'There was an error processing your attachment.' }, pageAccessToken);
      }
    }
    return; // Exit after handling the attachment
  }

  // Check if the message starts with the command prefix
  if (messageText && messageText.startsWith(prefix)) {
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
  if (messageText) {
    const aiCommand = commands.get('ai');
    if (aiCommand) {
      try {
        await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage);
      } catch (error) {
        console.error('Error executing Ai command:', error);
        sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
      }
    }
  }
}

module.exports = { handleMessage };
