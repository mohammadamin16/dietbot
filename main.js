const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_API_TOKEN' with the API token you received from the BotFather
const TOKEN = "6506226288:AAHY4r9Y0t5iIPGIq7VkKYZgfYQWiKejSkk";

// Create a new bot instance
const bot = new TelegramBot(TOKEN, {polling: true});
const userSession = {};

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const reply = "Welcome to the BMI Calculator bot! Please send me your weight (in kg).";

    // Send the welcome message
    bot.sendMessage(chatId, reply);

    // Set the user's state to "awaitingWeight"
    userSession[msg.from.id] = {state: "awaitingWeight"};
});

// Listen for user input
bot.on('text', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;

    if (userSession[userId]) {
        const userState = userSession[userId].state;

        if (userState === "awaitingWeight" && !isNaN(text)) {
            userSession[userId].weight = parseFloat(text);
            userSession[userId].state = "awaitingHeight";

            // Request the height
            const reply = "Thanks! Now, please send me your height (in cm).";
            bot.sendMessage(chatId, reply);
        } else if (userState === "awaitingHeight" && !isNaN(text)) {
            const weight = userSession[userId].weight;
            const height = parseFloat(text) / 100; // Convert cm to meters
            const bmi = (weight / (height * height)).toFixed(2);

            const reply = `Your BMI is ${bmi}.`;

            // Send the BMI calculation result
            bot.sendMessage(chatId, reply);

            // Reset the user's state
            delete userSession[userId];
        } else {
            const reply = "Invalid input. Please enter a valid number.";

            // Send an error message for invalid input
            bot.sendMessage(chatId, reply);
        }
    }
});


// Log any errors
bot.on('polling_error', (error) => {
    console.error(error);
});

console.log('Bot is running...');