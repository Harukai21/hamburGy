const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage'); // Importing sendMessage

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
  const messageText = event.message.text.trim();

  // We're using only the senderId, skipping profile fetching

  // Check if the message starts with the command prefix
  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage); // Pass senderId to all commands
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
      await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage); // Use senderId and message
    } catch (error) {
      console.error('Error executing Ai command:', error);
      sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
    }
  }
}

module.exports = { handleMessage };
