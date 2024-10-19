const axios = require("axios");
const request = require("request");

module.exports = {
  name: "pinterest",
  description: "Search for images on pinterest e.g /pinterest cat - 5",
  usage: "/pinterest search - number",
  author: "Biru",
  async execute(senderId, args, pageAccessToken, sendMessage) {
    const name = args.join(" ").trim().replace(/\s+/g, " ").replace(/(\s+\|)/g, "|").replace(/\|\s+/g, "|").split("-")[0];
    const number = args.join(" ").trim().replace(/\s+/g, " ").replace(/(\s+\|)/g, "|").split("-")[1] || 6;

    if (!name || !number) {
      return sendMessage(senderId, { text: "Missing Data. Please provide a search term and optionally a number of images." }, pageAccessToken);
    }

    const headers = {
      'authority': 'www.pinterest.com',
      'cache-control': 'max-age=0',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'upgrade-insecure-requests': '1',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
      'sec-gpc': '1',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'same-origin',
      'sec-fetch-dest': 'empty',
      'accept-language': 'en-US,en;q=0.9',
      'cookie': 'csrftoken=92c7c57416496066c4cd5a47a2448e28; g_state={"i_l":0}; _auth=1; _pinterest_sess=TWc9PSZBMEhrWHJZbHhCVW1OSzE1MW0zSkVid1o4Uk1laXRzdmNwYll3eEFQV0lDSGNRaDBPTGNNUk5JQTBhczFOM0ZJZ1ZJbEpQYlIyUmFkNzlBV2kyaDRiWTI4THFVUWhpNUpRYjR4M2dxblJCRFhESlBIaGMwbjFQWFc2NHRtL3RUcTZna1c3K0VjVTgyejFDa1VqdXQ2ZEQ3NG91L1JTRHZwZHNIcDZraEp1L0lCbkJWUytvRis2ckdrVlNTVytzOFp3ZlpTdWtCOURnbGc3SHhQOWJPTzArY3BhMVEwOTZDVzg5VDQ3S1NxYXZGUEEwOTZBR21LNC9VZXRFTkErYmtIOW9OOEU3ektvY3ZhU0hZWVcxS0VXT3dTaFpVWXNuOHhiQWdZdS9vY24wMnRvdjBGYWo4SDY3MEYwSEtBV2JxYisxMVVsV01McmpKY0VOQ3NYSUt2ZDJaWld6T0RacUd6WktITkRpZzRCaWlCTjRtVXNMcGZaNG9QcC80Ty9ZZWFjZkVGNURNZWVoNTY4elMyd2wySWhtdWFvS2dQcktqMmVUYmlNODBxT29XRWx5dWZSc1FDY0ZONlZJdE9yUGY5L0p3M1JXYkRTUDAralduQ2xxR3VTZzBveUc2Ykx3VW5CQ0FQeVo5VE8wTEVmamhwWkxwMy9SaTNlRUpoQmNQaHREbjMxRlRrOWtwTVI5MXl6cmN1K2NOTFNyU1cyMjREN1ZFSHpHY0ZCR1RocWRjVFZVWG9VcVpwbXNGdlptVzRUSkNadVc1TnlBTVNGQmFmUmtrNHNkVEhXZytLQjNUTURlZXBUMG9GZ3YwQnVNcERDak16Nlp0Tk13dmNsWG82U2xIKyt5WFhSMm1QUktYYmhYSDNhWnB3RWxTUUttQklEeGpCdE4wQlNNOVRzRXE2NkVjUDFKcndvUzNMM2pMT2dGM05WalV2QStmMC9iT055djFsYVBKZjRFTkRtMGZZcWFYSEYvNFJrYTZSbVRGOXVISER1blA5L2psdURIbkFxcTZLT3RGeGswSnRHdGNpN29KdGFlWUxtdHNpSjNXQVorTjR2NGVTZWkwPSZzd3cwOXZNV3VpZlprR0VBempKdjZqS00ybWM9',
    };

    const options = {
      url: 'https://www.pinterest.com/search/pins/?q=' + encodeURIComponent(name) + '&rs=typed&term_meta[]=' + encodeURIComponent(name) + '%7Ctyped',
      headers: headers
    };

    request(options, async (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return sendMessage(senderId, { text: "An error occurred while fetching Pinterest results. Please try again." }, pageAccessToken);
      }

      const arrMatch = body.match(/https:\/\/i\.pinimg\.com\/originals\/[^.]+\.jpg/g);

      if (arrMatch && arrMatch.length) {
        // First, send a message with the search results description
        await sendMessage(senderId, { text: `► Pinterest Results for: ${name} (${Math.min(arrMatch.length, number)} images)` }, pageAccessToken);

        // Send images one by one
        for (let i = 0; i < Math.min(arrMatch.length, number); i++) {
          const imageUrl = arrMatch[i];
          try {
            await sendMessage(senderId, {
              attachment: {
                type: 'image',
                payload: {
                  url: imageUrl,
                  is_reusable: false
                }
              }
            }, pageAccessToken);
          } catch (err) {
            console.error(`Failed to send image: ${imageUrl}`, err);
          }
        }
      } else {
        return sendMessage(senderId, { text: "No images found." }, pageAccessToken);
      }
    });
  }
};
