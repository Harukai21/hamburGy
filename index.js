const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');
const { handleAttachment } = require('./handles/handleAttachment');
const { startAutoPost } = require('./utils/autopost');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

// Handle root route
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
            },
        });
        console.log('Post successful:', response.data);
    } catch (error) {
        console.error('Error in httpPost:', error.response ? error.response.data : error.message);
    }
}

// Start auto-posting when server starts
app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running');

    startAutoPost({
        getCurrentUserID: () => PAGE_ACCESS_TOKEN, // Replace this with actual logic if needed
        httpPost: httpPost // Use the httpPost function we just defined
    });
});

// Restart server every 8 hours
setInterval(() => {
    console.log('Restarting server...');
    process.exit(0);
}, 8 * 60 * 60 * 1000); // 8 hours in milliseconds
