const { Client } = require("youtubei");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const https = require("https");
const cheerio = require("cheerio");

const youtube = new Client();

function GetOutputYt(url) {
  const options = {
    hostname: "ytbsave.com",
    path: "/mates/en/analyze/ajax?retry=undefined&platform=youtube",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json, text/javascript, */*; q=0.01",
    },
  };

  const data = `url=${encodeURIComponent(url)}&ajax=1&lang=en`;
  options.headers["Content-Length"] = Buffer.byteLength(data);

  function makeRequest(maxRetries = 3) {
    let retries = 0;

    function attemptRequest() {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = "";
          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            try {
              const jsonData = JSON.parse(responseData);
              const $ = cheerio.load(jsonData.result);
              const downloadLink = $('a[data-ftype="mp4"][data-fquality="128"]').attr("href");
              const title = $("#video_title").text().trim();
              resolve({ downloadLink, title });
            } catch (error) {
              reject(error);
            }
          });
        });

        req.on("error", (error) => {
          if (retries < maxRetries) {
            retries++;
            console.log(`Retrying request... (${retries}/${maxRetries})`);
            attemptRequest().then(resolve).catch(reject);
          } else {
            reject(error);
          }
        });

        req.write(data);
        req.end();
      });
    }

    return attemptRequest();
  }

  return makeRequest();
}

async function downloadVideoAudio(videoUrl, senderId, sendMessage, pageAccessToken) {
  try {
    const tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "audio-"));
    const filePath = path.join(tempFolder, "audio.mp3");
    const writer = fs.createWriteStream(filePath);

    const { downloadLink, title } = await GetOutputYt(videoUrl);

    if (!downloadLink) {
      console.error("No valid download link found.");
      await sendMessage(senderId, { text: "No valid download link found." }, pageAccessToken);
      return;
    }

    console.log("Downloading from URL:", downloadLink);

    const response = await axios.get(downloadLink, { responseType: "stream" });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    const stream = fs.createReadStream(filePath);
    await sendMessage(senderId, {
      attachment: {
        type: "audio",
        payload: { is_reusable: false },
      },
    }, pageAccessToken);

    fs.unlinkSync(filePath);
    fs.rmdirSync(tempFolder);
  } catch (error) {
    console.error("Error:", error);
    await sendMessage(senderId, { text: "An error occurred while processing your request." }, pageAccessToken);
  }
}

module.exports = {
  name: "sing",
  description: "downloads mp3 from youtube",
  usage: "/sing <songTitle>",
  author: "Biru",

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const searchQuery = args.join(" ");
    if (!searchQuery) {
      console.error("No search query provided.");
      return sendMessage(senderId, { text: "Please provide a search keyword or a YouTube link." }, pageAccessToken);
    }

    try {
      console.log(`Searching YouTube for: ${searchQuery}`);
      const searchResults = await youtube.search(searchQuery, { type: "video" });

      if (!searchResults.items.length) {
        console.error(`No results found for: ${searchQuery}`);
        return sendMessage(senderId, { text: "No results found. Please try again with a different keyword." }, pageAccessToken);
      }

      const video = searchResults.items[0];
      const videoId = video.id?.videoId || video.id;
      console.log(`Downloading audio for video: ${video.title}`);
      sendMessage(senderId, { text: `Downloading "${video.title}" as audio...` }, pageAccessToken);

      await downloadVideoAudio(`https://youtu.be/${videoId}`, senderId, sendMessage, pageAccessToken);
    } catch (error) {
      console.error("Search Error:", error);
      sendMessage(senderId, { text: "An error occurred while searching for the video." }, pageAccessToken);
    }
  },
};
