const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = "6506226288:AAHY4r9Y0t5iIPGIq7VkKYZgfYQWiKejSkk";
const BALE_TOKEN = "228832439:uxcTGfcNLLTrdSwXP3nEeXEQJI7otCbP3H7azvEe"

// Create a new bot instance
const bot = new TelegramBot(BALE_TOKEN, {polling: true, baseApiUrl: "https://tapi.bale.ai"});
const userSession = {};

// Listen for the /start command
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
            userSession[userId].height = parseFloat(text);
            userSession[userId].state = "awaitingPhoneNumber";

            // Request the phone number
            const reply = "Great! Now, please send me your phone number (e.g., +1234567890).";
            bot.sendMessage(chatId, reply);
        } else if (userState === "awaitingPhoneNumber" && text.match(/^\+\d{10,}$/)) {
            const weight = userSession[userId].weight;
            const height = parseFloat(userSession[userId].height) / 100; // Convert cm to meters
            const bmi = (weight / (height * height)).toFixed(2);
            userSession[userId].phoneNumber = text;

            // Send the BMI calculation result and ask for confirmation
            const resultMessage = `Your BMI is ${bmi}. Please confirm your phone number: ${text}`;
            const keyboard = [[{text: 'Yes', callback_data: 'confirm'}]];
            const options = {reply_markup: {inline_keyboard: keyboard}};
            bot.sendMessage(chatId, resultMessage, options);
        } else {
            const reply = "Invalid input. Please enter a valid value.";

            // Send an error message for invalid input
            bot.sendMessage(chatId, reply);
        }
    }
});

// Listen for callback queries (e.g., confirmation)
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const userId = query.from.id;
    const data = query.data;

    if (data === "confirm" && userSession[userId]) {
        const phoneNumber = userSession[userId].phoneNumber;

        // Send a confirmation message with the phone number
        const confirmationMessage = `Thank you! Your phone number ${phoneNumber} has been confirmed.`;
        bot.sendMessage(chatId, confirmationMessage);

        // Reset the user's state
        delete userSession[userId];
    }
});

// Log any errors
bot.on('polling_error', (error) => {
    console.error(error);
});

console.log('Bot is running...');