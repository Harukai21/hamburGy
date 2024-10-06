const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: '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' });


const messageHistory = new Map();

module.exports = {
  name: 'ai',
  description: 'Listens to any incoming message and interacts with Groq AI',
  author: 'Biru',

  async execute(senderId, messageText, pageAccessToken, sendMessage) {
    try {
      // Log the initial user message
      console.log("User's Message:", messageText);

      // Indicate that the bot is processing the request
      sendMessage(senderId, { text: '' }, pageAccessToken);

      // Initialize user history if not present
      let userHistory = messageHistory.get(senderId) || [];
      if (userHistory.length === 0) {
        userHistory.push({ role: 'system', content: 'You are a helpful and kind assistant that answers everything.' });
      }
      userHistory.push({ role: 'user', content: messageText });

      // Send the request to the Groq API
      const chatCompletion = await groq.chat.completions.create({
        messages: userHistory,
        model: 'llama3-8b-8192',
        temperature: 1,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null
      });

      // Collect the response message from the stream
      let responseMessage = '';
      for await (const chunk of chatCompletion) {
        responseMessage += (chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content) || '';
      }

      // Append the assistant's response to the history
      userHistory.push({ role: 'assistant', content: responseMessage });

      // Update the message history for the user
      messageHistory.set(senderId, userHistory);

      // Send the response message back to the user
      sendMessage(senderId, { text: responseMessage }, pageAccessToken);

    } catch (error) {
      console.error('Error communicating with Groq:', error.message);
      sendMessage(senderId, { text: "I'm busy right now, please try again later." }, pageAccessToken);
    }
  }
};
