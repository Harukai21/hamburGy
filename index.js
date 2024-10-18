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

// Load commands dynamically
const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
const commands = commandFiles.map(file => {
    const command = require(`./commands/${file}`);
    return {
        name: command.name,
        info: command.info || 'No description available'
    };
});

app.get('/', (req, res) => {
    res.send('Welcome to the Webhook Server');
});

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

// Implement httpPost function
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

// Set Messenger commands
function setMessengerCommands(pageAccessToken, commands) {
    const payload = {
        "commands": [
            {
                "locale": "default",
                "commands": commands // Commands loaded from command files
            }
        ]
    };

    httpPost(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${pageAccessToken}`, payload);
}

// Start server but do not immediately auto-post
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running');

    // Start the auto-posting process
    startAutoPost({
        getCurrentUserID: () => PAGE_ACCESS_TOKEN, 
        httpPost: httpPost 
    });

    // Set Messenger commands
    setMessengerCommands(PAGE_ACCESS_TOKEN, commands);
});

// Optionally restart the server every 8 hours
setInterval(() => {
    console.log('Restarting server...');
    process.exit(0);
}, 8 * 60 * 60 * 1000);

// Optionally add an endpoint to refresh commands
app.post('/refresh-commands', (req, res) => {
    setMessengerCommands(PAGE_ACCESS_TOKEN, commands);
    res.status(200).send('Commands refreshed');
});
