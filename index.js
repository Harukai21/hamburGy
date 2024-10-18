const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const request = require('request'); // Required for Messenger API requests
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');
const { handleAttachment } = require('./handles/handleAttachment'); // Import handleAttachment
const path = require('path'); // For loading commands
const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

const COMMANDS_DIR = path.join(__dirname, 'commands');

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
            handleMessage(event, PAGE_ACCESS_TOKEN); // Handle text message
          }
          if (event.message.attachments) {
            handleAttachment(event, PAGE_ACCESS_TOKEN); // Handle attachments
          }
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN); // Handle postback
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  setupMessengerCommands();  // Call the function to setup Messenger commands when the server starts
});

// Set interval to restart the system every 8 hours
setInterval(() => {
  console.log('Restarting the server...');
  process.exit(0);  // Exit with success code
}, 8 * 60 * 60 * 1000);  // 8 hours in milliseconds

// Function to load commands dynamically from the 'commands' directory and send them to Messenger
function setupMessengerCommands() {
  const commandFiles = fs.readdirSync(COMMANDS_DIR).filter(file => file.endsWith('.js'));
  const commands = commandFiles.map(file => {
    const command = require(path.join(COMMANDS_DIR, file));
    return {
      name: command.name,
      info: command.info || 'No description available',
    };
  });

  const commandPayload = {
    "commands": [
      {
        "locale": "default",
        "commands": commands
      }
    ]
  };

  // Send the command payload to the Facebook Messenger Profile API
  request({
    url: `https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`,
    method: 'POST',
    json: commandPayload
  }, (error, response, body) => {
    if (error) {
      console.error('Error setting Messenger commands:', error);
    } else if (response.body.error) {
      console.error('Error response from Facebook:', response.body.error);
    } else {
      console.log('Messenger commands set successfully:', body);
    }
  });
}
