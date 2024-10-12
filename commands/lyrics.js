const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
  name: 'lyrics',
  description: 'search for lyrics from Google or Musixmatch',
  usage: '/lyrics <SongTitle>',
  author: 'biru',
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const songTitle = args.join(' ');

    if (!songTitle) {
      sendMessage(senderId, { text: 'Please provide a song name to get lyrics.' }, pageAccessToken);
      return;
    }

    try {
      const headers = { 'User-Agent': 'Mozilla/5.0' };
      let lyrics = null;
      let artist = null;
      let imageUrl = null; // Store the image URL

      // First attempt: Fetch lyrics from Google
      try {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(songTitle.replace(' ', '+'))}+lyrics`;
        const googleResponse = await axios.get(googleUrl, { headers });
        const $ = cheerio.load(googleResponse.data);
        const data = $('div[data-lyricid]');

        if (data.length > 0) {
          const content = data.html().replace('</span></div><div.*?>', '\n</span>');
          const parse = cheerio.load(content);
          lyrics = parse('span[jsname]').text();
          artist = $('div.auw0zb').text() || 'Unknown';
          imageUrl = $('g-img img').attr('src'); // Extract image URL from Google response
        }
      } catch (googleError) {
        console.log('Google lyrics fetch failed, trying Musixmatch...');
      }

      // Fallback: If Google didn't provide lyrics, try Musixmatch
      if (!lyrics) {
        try {
          const musixmatchUrl = `https://www.musixmatch.com/search/${encodeURIComponent(songTitle.replace(' ', '+'))}`;
          const musixmatchResponse = await axios.get(musixmatchUrl, { headers });
          const mxmMatch = musixmatchResponse.data.match(/<a class="title" href="(.*?)"/);

          if (mxmMatch) {
            const mxmUrl = `https://www.musixmatch.com${mxmMatch[1]}`;
            const mxmResponse = await axios.get(mxmUrl, { headers });
            lyrics = cheerio.load(mxmResponse.data)('.lyrics__content__ok').text();
            artist = cheerio.load(mxmResponse.data)('.mxm-track-title__artist-link').text() || 'Unknown';
            imageUrl = cheerio.load(mxmResponse.data)('.banner-album-image-desktop img').attr('src'); // Extract image from Musixmatch response
          }
        } catch (musixmatchError) {
          console.log('Musixmatch lyrics fetch failed:', musixmatchError);
        }
      }

      // Check if lyrics were found
      if (lyrics) {
        const lyricsMessage = `🎶 *${songTitle}* by ${artist}\n\n${lyrics}`;

        // Split the lyrics message into chunks if it exceeds 2000 characters
        const maxMessageLength = 2000;
        if (lyricsMessage.length > maxMessageLength) {
          const messages = splitMessageIntoChunks(lyricsMessage, maxMessageLength);
          for (const message of messages) {
            sendMessage(senderId, { text: message }, pageAccessToken);
          }
        } else {
          sendMessage(senderId, { text: lyricsMessage }, pageAccessToken);
        }

        // Send the image immediately after the lyrics
        if (imageUrl) {
          sendMessage(senderId, {
            attachment: {
              type: 'image',
              payload: {
                url: imageUrl, // Use the dynamically extracted image URL
                is_reusable: true
              }
            }
          }, pageAccessToken).catch(err => {
            console.error('Error sending image:', err);
          });
        }
      } else {
        sendMessage(senderId, { text: 'Sorry, no lyrics were found for your query.' }, pageAccessToken);
      }
    } catch (error) {
      console.error('Error retrieving lyrics:', error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request.' }, pageAccessToken);
    }
  }
};

// Helper function to split long messages into chunks
function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}
