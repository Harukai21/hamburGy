// /utils/autopost.js
const cron = require('node-cron');
const axios = require('axios');

let isCronStarted = false;

module.exports.startAutoPost = function(api) {
    if (!isCronStarted) {
        cron.schedule("0 * * * *", async function () { 
            try {
                const response = await axios.get("https://api.popcat.xyz/pickuplines");
                const pickupLine = response.data.pickupline;

                const message = `“${pickupLine}”`;

                const formData = {
                    message: message,
                };

                await api.httpPost(
                    `https://graph.facebook.com/v12.0/me/feed`, // Updated Graph API URL
                    {
                        message: message,
                        access_token: api.getCurrentUserID()
                    }
                );

            } catch (error) {
                console.error("Error during auto-posting:", error);
            }
        }, {
            scheduled: true,
            timezone: "Asia/Manila",
        });

        isCronStarted = true;
    }
};
