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

// Function to send sender actions with retry logic (typing_on, typing_off, mark_seen)
async function sendSenderAction(senderId, pageAccessToken, action, retries = 3) {
  try {
    await sendMessage(senderId, {
      sender_action: action // 'typing_on', 'typing_off', or 'mark_seen'
    }, pageAccessToken);
  } catch (error) {
    console.error(`Error sending ${action}:`, error);

    // Retry logic for network issues (ETIMEDOUT or ENETUNREACH)
    if (retries > 0 && (error.code === 'ETIMEDOUT' || error.code === 'ENETUNREACH')) {
      console.log(`Retrying to send ${action}... (${3 - retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
      await sendSenderAction(senderId, pageAccessToken, action, retries - 1);
    } else {
      console.error(`Failed to send ${action} after retries.`);
    }
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Start mark_seen as soon as the message is received
  await sendSenderAction(senderId, pageAccessToken, 'mark_seen');

  // Start typing indicator immediately
  await sendSenderAction(senderId, pageAccessToken, 'typing_on');

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
    await sendSenderAction(senderId, pageAccessToken, 'typing_off');
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
  await sendSenderAction(senderId, pageAccessToken, 'typing_off');
}

module.exports = { handleMessage };
