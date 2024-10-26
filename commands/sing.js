const { Client } = require("youtubei");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const os = require("os");
const cheerio = require("cheerio");

const youtube = new Client();

const baseUrl = "https://snapsave.app/action.php";
const lang = "en";
const cookie = '_ga=GA1.1.253146091.1720025059; __gads=ID=ea78c10b57674a22:T=1720025060:RT=1720028639:S=ALNI_MYTI6y_R_9g5lFYwNJKzC3FZhONsQ; __gpi=UID=00000e71bfbb1126:T=1720025060:RT=1720028639:S=ALNI_MY5B9BAg8DFTtGMSiYi7MZ9_moj6g; __eoi=ID=29d84a00bfd16bbc:T=1720025060:RT=1720028639:S=AA-Afjaq6T3JBLGedYOS1BSKtXxu; FCNEC=%5B%5B%22AKsRol9sGHON-Qjnu8g9pXDQnjOc72SXe_4cCDOldAsnL2515xdRGPNPkse479cqgd1l7W4Y91d68TOrWAh5eQNw_6ntBaoBWLwBIkiVTceU0k-kGPMNk7llE2MGcfBZwDtJyCACzX4vNRv4IBlBeFgwvKJa8D2ckw%3D%3D%22%5D%5D';

async function GetFullResponse(inputUrl) {
  try {
    const formData = { url: inputUrl };
    const response = await axios.post(baseUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundary9SOOmsSKyncbGmps",
        Cookie: cookie,
        Accept: "*/*",
        "Accept-Language": "en-US,en;q=0.9",
        DNT: "1",
        Origin: "https://snapsave.app",
        Referer: "https://snapsave.app/",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0",
      },
      params: { lang: lang },
    });

    const obfuscatedCode = response.data;
    return EvalDecode(obfuscatedCode);
  } catch (error) {
    console.error("Error fetching full response:", error);
    return null;
  }
}

function EvalDecode(source) {
  try {
    const self = this;
    self._eval = self.eval;
    self.eval = (_code) => {
      self.eval = self._eval;
      return _code;
    };
    return self._eval(source);
  } catch (error) {
    return `Error decoding code: ${error.message}`;
  }
}

function extractDownloadLinks(htmlContent) {
  const $ = cheerio.load(htmlContent);
  const downloadLinks = {};
  $("tbody tr").each((index, element) => {
    const tdText = $(element).find("td").first().text().trim();
    if (tdText === "360p (SD)") {
      downloadLinks.SD = $(element).find('a[href^="https://d.rapidcdn.app/"]').attr("href");
      return false;
    }
  });
  return downloadLinks;
}

function extractHTMLFromJS(jsCode) {
  const htmlMatch = jsCode.match(/innerHTML = "(.*?)";/);
  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1].replace(/\\"/g, '"').replace(/\\\\"/g, '\\"');
  }
  return null;
}

async function downloadVideoAudio(videoUrl, senderId, sendMessage, pageAccessToken) {
  try {
    const tempFolder = fs.mkdtempSync(path.join(os.tmpdir(), "audio-"));
    const filePath = path.join(tempFolder, "audio.mp3");
    const writer = fs.createWriteStream(filePath);

    const fullResponse = await GetFullResponse(videoUrl);
    const extractedHTML = extractHTMLFromJS(fullResponse);
    const links = extractDownloadLinks(extractedHTML);

    // Check if the SD link is valid
    if (!links.SD) {
      console.error("No valid download link found for SD quality.");
      await sendMessage(senderId, { text: "No valid download link found." }, pageAccessToken);
      return;
    }

    // Log the extracted URL for debugging
    console.log("Downloading from URL:", links.SD);

    const response = await axios.get(links.SD, { responseType: "stream" });
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
