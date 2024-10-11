const fs = require('fs');
const path = require('path');
const { sendMessage } = require('./sendMessage'); // Importing sendMessage
const axios = require('axios'); // Using axios instead of node-fetch

const commands = new Map();
const prefix = '/'; // Set your desired prefix

// Load all command modules dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, '../commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.set(command.name.toLowerCase(), command); // Ensure command names are stored in lowercase
}

// Helper function to fetch user profile information using axios
async function getUserProfile(senderId, pageAccessToken) {
  const url = `https://graph.facebook.com/${senderId}?fields=first_name,last_name&access_token=${pageAccessToken}`;
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch user profile: ${error.message}`);
    return null; // Return null if there was an error
  }
}

async function handleMessage(event, pageAccessToken) {
  const senderId = event.sender.id;
  const messageText = event.message.text.trim();

  // Fetch user's profile info (name) for the call command
  const userProfile = await getUserProfile(senderId, pageAccessToken);

  if (!userProfile) {
    // Handle case where user profile could not be fetched
    console.error('Could not fetch user profile, proceeding without name.');
  }

  const senderName = userProfile ? `${userProfile.first_name} ${userProfile.last_name}`.trim() : 'User';

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
