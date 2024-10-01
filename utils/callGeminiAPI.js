const axios = require('axios');

async function callGeminiAPI(prompt) {
  try {
    const apiUrl = `https://deku-rest-api.gleeze.com/gemini?prompt=${encodeURIComponent(prompt)}&id=40`;
    const response = await axios.get(apiUrl);
    
    // Access the 'gemini' property from the response data
    return response.data.gemini; 
  } catch (error) {
    throw new Error(`Gemini API call failed: ${error.message}`);
  }
}

module.exports = { callGeminiAPI };
