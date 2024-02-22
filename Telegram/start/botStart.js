const bot = require("../app")
const description = require("../components/description")
const botController = require("../../controllers/bot.controller")
const BotStart = () => {
	const webAppUrl = "https://zipperapp.vercel.app/"

	bot.on("message", async (msg) => {
		const text = msg.text
		const chatId = msg.chat.id
		const userId = msg.from.id
		const first_name = msg.from.first_name || null
		const last_name = msg.from.last_name || null
		const username = msg.from.username || null
		await botController.createUser({
			userId,
			first_name,
			last_name,
			username,
		})

		if (text === "/start") {
			await bot.sendMessage(chatId, description, {
				reply_markup: {
					inline_keyboard: [
						[{ text: "Open App", web_app: { url: webAppUrl } }],
					],
				},
				parse_mode: "HTML",
			})
		}
	})
}

module.exports = BotStart()
