const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');
const { handleAttachment } = require('./handles/handleAttachment');
const { startAutoPost } = require('./utils/autopost');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

// Root endpoint for basic server check
app.get('/', (req, res) => {
    res.send('Welcome to the Webhook Server');
});

// Webhook verification
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
});

// Webhook to handle incoming messages
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                if (event.message) {
                    if (event.message.text) {
                        handleMessage(event, PAGE_ACCESS_TOKEN);
                    }
                    if (event.message.attachments) {
                        handleAttachment(event, PAGE_ACCESS_TOKEN);
                    }
                } else if (event.postback) {
                    handlePostback(event, PAGE_ACCESS_TOKEN);
                }
            });
        });

        res.status(200).send('EVENT_RECEIVED');
    } else {
        res.sendStatus(404);
    }
});

// Function to set Messenger commands dynamically
async function setMessengerCommands(pageAccessToken, prefix = '/') {
    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
    
    let commandsPayload = [];
    
    // Read command files dynamically
    commandFiles.forEach(file => {
        const readCommand = require(`./commands/${file}`);
        const commandName = readCommand.name || (file.replace(".js", "")).toLowerCase();
        const description = readCommand.description || "No description provided.";

        // Ensure only commands with the prefix are added
        commandsPayload.push({
            name: `${prefix + commandName}`,  // Prefix each command
            description
        });

        console.log(`/${commandName} Loaded`);
    });

    console.log("Wait...");

    // Fetch current commands from Facebook Messenger Profile API
    try {
        const dataCmd = await axios.get(`https://graph.facebook.com/v21.0/me/messenger_profile`, {
            params: {
                fields: "commands",
                access_token: pageAccessToken
            }
        });

        // Check if commands are unchanged
        if (dataCmd.data.data && dataCmd.data.data[0].commands[0].commands.length === commandsPayload.length) {
            return console.log("Commands not changed");
        }
    } catch (error) {
        console.error('Error fetching commands:', error.response ? error.response.data : error.message);
    }

    // Clear old commands before updating (to avoid duplicates)
    try {
        await axios.delete(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${pageAccessToken}`, {
            data: {
                fields: ["commands"]
            }
        });
        console.log("Old commands cleared.");
    } catch (error) {
        console.error('Error clearing commands:', error.response ? error.response.data : error.message);
    }

    // If commands have changed, update the commands
    try {
        const loadCmd = await axios.post(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${pageAccessToken}`, {
            commands: [
                {
                    locale: "default",
                    commands: commandsPayload
                }
            ]
        }, {
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (loadCmd.data.result === "success") {
            console.log("Commands loaded!");
        } else {
            console.log("Failed to load commands");
        }
    } catch (error) {
        console.error('Error updating commands:', error.response ? error.response.data : error.message);
    }
}

// Implement httpPost function for autoposting
async function httpPost(url, formData) {
    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`,
            },
        });
        console.log('Post successful:', response.data);
    } catch (error) {
        console.error('Error in httpPost:', error.response ? error.response.data : error.message);
    }
}

// Start server but do not immediately auto-post
app.listen(process.env.PORT || 3000, async () => {
    console.log('Server is running');

    // Start the auto-posting process
    startAutoPost({
        getCurrentUserID: () => PAGE_ACCESS_TOKEN,
        httpPost: httpPost
    });

    // Load Messenger commands with the "/" prefix
    await setMessengerCommands(PAGE_ACCESS_TOKEN, '/'); // Ensure '/' is passed as the prefix
});

// Optionally restart the server every 8 hours without triggering auto-post
setInterval(() => {
    console.log('Restarting server...');
    process.exit(0);
}, 8 * 60 * 60 * 1000);

// Optional refresh endpoint for reloading commands manually
app.post('/refresh', async (req, res) => {
    await setMessengerCommands(PAGE_ACCESS_TOKEN, '/'); // Ensure '/' is passed as the prefix
    res.status(200).send('Commands refreshed');
});
