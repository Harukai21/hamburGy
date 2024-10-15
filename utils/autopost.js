const cron = require('node-cron');
const axios = require('axios');

let isCronStarted = false;

function getRandomInterval() {
    // Choose a random interval between 2, 3, 4, or 5 hours
    const hours = [2, 3, 4, 5];
    const randomHour = hours[Math.floor(Math.random() * hours.length)];
    return randomHour * 60 * 60 * 1000; // Convert hours to milliseconds
}

async function postPickupLine(api) {
    try {
        const response = await axios.get("https://api.popcat.xyz/pickuplines");
        const pickupLine = response.data.pickupline;

        const message = `“${pickupLine}”`;

        const formData = {
            message: message,
            access_token: api.getCurrentUserID(),
        };

        await api.httpPost(
            `https://graph.facebook.com/v17.0/303798532824975/feed`, // Updated Graph API URL
            formData
        );

        console.log("Posted successfully:", message);
    } catch (error) {
        console.error("Error during auto-posting:", error);
    }

    // Schedule the next post after a random interval
    const randomInterval = getRandomInterval();
    console.log(`Next post scheduled in ${randomInterval / (60 * 60 * 1000)} hours`);
    setTimeout(() => postPickupLine(api), randomInterval); // Re-schedule after the random interval
}

module.exports.startAutoPost = function(api) {
    if (!isCronStarted) {
        // Start the initial post
        console.log("Starting the auto-post process...");
        postPickupLine(api);
        isCronStarted = true;
    }
};
