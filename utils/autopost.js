const cron = require('node-cron');
const axios = require('axios');

let isCronStarted = false;

// Philippines time is UTC+8
const postTime = '0 12 * * *'; // 12 PM every day

function getRandomApi() {
    const apis = [
        "https://api.popcat.xyz/pickuplines", 
        "https://api.popcat.xyz/fact"
    ];
    return apis[Math.floor(Math.random() * apis.length)];
}

async function postPickupLine(api) {
    try {
        const chosenApi = getRandomApi();
        const response = await axios.get(chosenApi);

        let message;
        if (chosenApi.includes("pickuplines")) {
            message = `“${response.data.pickupline}”`;
        } else {
            message = `“Fact: ${response.data.fact}”`;
        }

        const formData = {
            message: message,
            access_token: api.getCurrentUserID(),
        };

        await api.httpPost(
            `https://graph.facebook.com/v17.0/303798532824975/feed`,
            formData
        );

        console.log("Posted successfully:", message);
    } catch (error) {
        console.error("Error during auto-posting:", error);
    }
}

module.exports.startAutoPost = function(api) {
    if (!isCronStarted) {
        console.log("Starting the cron job...");

        cron.schedule(postTime, () => {
            console.log("Running daily post at 12 PM (Philippines time)...");
            postPickupLine(api);
        }, {
            timezone: "Asia/Manila"
        });

        isCronStarted = true;
    }
};
