import emailjs from "@emailjs/nodejs";
import TelegramBot from "node-telegram-bot-api";

const TELEGRAM_TOKEN = "6506226288:AAHY4r9Y0t5iIPGIq7VkKYZgfYQWiKejSkk";
const BALE_TOKEN = "228832439:uxcTGfcNLLTrdSwXP3nEeXEQJI7otCbP3H7azvEe";

// Create a new bot instance
const bot = new TelegramBot(BALE_TOKEN, {
  polling: true,
  baseApiUrl: "https://tapi.bale.ai",
});
const userSession = {};
const weightMsg = " لطفا عدد وزن خود را به سانتی متر ارسال کنید، مثال 80";
const welcomeMsg = "خوش آمدید.عدد قد خود را ارسال کنید، مثال: 176";
const phoneMsg = "برای دیدن عدد bmi خود لطفا شماره تلفن خود را وارد کنید";

// Listen for the /start command
bot.onText(/\/start/, (msg) => {
  // Send the welcome message
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, welcomeMsg);

  // Set the user's state to "awaitingWeight"
  userSession[msg.from.id] = { state: "awaitingWeight" };
});

// Listen for user input
bot.on("text", (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const text = msg.text;

  if (userSession[userId]) {
    const userState = userSession[userId].state;

    if (userState === "awaitingWeight" && !isNaN(text)) {
      userSession[userId].weight = parseFloat(text);
      userSession[userId].state = "awaitingHeight";

      // Request the height
      bot.sendMessage(chatId, weightMsg);
    } else if (userState === "awaitingHeight" && !isNaN(text)) {
      userSession[userId].height = parseFloat(text);
      userSession[userId].state = "awaitingPhoneNumber";

      // Request the phone number
      bot.sendMessage(chatId, phoneMsg);
    } else if (userState === "awaitingPhoneNumber" && text) {
      const weight = userSession[userId].weight;
      const height = parseFloat(userSession[userId].height) / 100; // Convert cm to meters
      const bmi = (weight / (height * height)).toFixed(2);
      userSession[userId].phoneNumber = text;

      emailjs
        .send(
          "service_w580jyj",
          "template_s2gfhkn",
          {
            from_name: "Diet Bot",
            phone: text,
          },
          {
            publicKey: "Q4fKfqxDks9Slhok8",
            privateKey: "7jsdX-XP5m8SaEgFLUzNm",
          }
        )
        .then(
          (response) => {
            console.log("SUCCESS!", response.status, response.text);
          },
          (err) => {
            console.log("FAILED...", err);
          }
        );
      // Send the BMI calculation result and ask for confirmation
      const resultMessage = `Your BMI is ${bmi}.`;
      const keyboard = [[{ text: "Yes", callback_data: "confirm" }]];
      const options = { reply_markup: { inline_keyboard: keyboard } };
      bot.sendMessage(chatId, resultMessage);
    } else {
      const reply = "Invalid input. Please enter a valid value.";

      // Send an error message for invalid input
      bot.sendMessage(chatId, reply);
    }
  }
});

// Listen for callback queries (e.g., confirmation)
bot.on("callback_query", (query) => {
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
bot.on("polling_error", (error) => {
  console.error(error);
});

console.log("Bot is running...");
