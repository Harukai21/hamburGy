const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage'); // Importing sendMessage
const fetch = require('node-fetch'); // Ensure you have 'node-fetch' installed

const commands = new Map();
const prefix = '/'; // Set your desired prefix

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command); // Ensure command names are stored in lowercase
}

// Helper function to fetch user profile information
async function getUserProfile(senderId, pageAccessToken) {
  const url = `https://graph.facebook.com/${senderId}?fields=first_name,last_name&access_token=${pageAccessToken}`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to fetch user profile: ${response.statusText}`);
    return { first_name: 'User', last_name: '' }; // Fallback if we can't get the name
  }
  return response.json();
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Fetch user's profile info (name) for the call command
  const userProfile = await getUserProfile(senderId, pageAccessToken);
  const senderName = `${userProfile.first_name} ${userProfile.last_name}`.trim();

  // Check if the message starts with the command prefix
  if (messageText.startsWith(prefix)) {
    const args = messageText.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    if (commands.has(commandName)) {
      const command = commands.get(commandName);
      try {
        // Pass senderName only to the call command, others only require senderId
        if (commandName === 'call') {
          await command.execute(senderId, senderName, args, pageAccessToken, sendMessage);
        } else {
          await command.execute(senderId, args, pageAccessToken, sendMessage); // For all other commands
        }
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
}

module.exports = { handleMessage };
