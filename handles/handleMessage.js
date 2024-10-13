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

// Function to send typing indicator
async function sendTypingIndicator(senderId, pageAccessToken, action) {
  await sendMessage(senderId, {
    sender_action: action // 'typing_on', 'typing_off', or 'mark_seen'
  }, pageAccessToken);
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Start typing indicator as soon as the message is received
  await sendTypingIndicator(senderId, pageAccessToken, 'typing_on');

  // Check if the message starts with the command prefix
  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(/\s+/); // Split by spaces to ensure it's an array
    const commandName = args.shift().toLowerCase(); // Get the command name

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      try {
        await command.execute(senderId, args, pageAccessToken, sendMessage); // Pass args as an array
      } catch (error) {
        console.error(`Error executing command ${commandName}:`, error);
        await sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
      }
    }
    // Stop typing indicator after response is sent
    await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
    return; // Exit after handling a command with the prefix
  }

  // If the message doesn't start with the prefix, handle it as "Ai" by default
  const aiCommand = commands.get('ai');
  if (aiCommand) {
    try {
      await aiCommand.execute(senderId, messageText, pageAccessToken, sendMessage); // Pass message as string
    } catch (error) {
      console.error('Error executing Ai command:', error);
      await sendMessage(senderId, { text: 'There was an error processing your request.' }, pageAccessToken);
    }
  }

  // Stop typing indicator after response is sent
  await sendTypingIndicator(senderId, pageAccessToken, 'typing_off');
}

module.exports = { handleMessage };
