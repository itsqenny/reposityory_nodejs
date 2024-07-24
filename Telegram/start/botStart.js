require("dotenv").config()
const bot = require("../app")
const description = require("../components/description")
const botController = require("../../controllers/bot.controller")
const BotStart = () => {
	const allowedChatIds = [5463868504, 6241433836]
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
		const operatorId = "5463868504"
		const forwardedMsg = await bot.forwardMessage(
			operatorId,
			chatId,
			msg.message_id
		)
		const channelMessageText = `👤 Пользователь: ${userId}`.trim()
		await bot.sendMessage(operatorId, channelMessageText, {
			reply_to_message_id: forwardedMsg.message_id,
			parse_mode: "HTML",
		})
		if (text === "/start") {
			await bot.sendMessage(chatId, description, {
				parse_mode: "HTML",
			})
		}
	})
	bot.onText(/\/answer (\d+) (.+)/, async (msg, match) => {
		const chatId = msg.chat.id
		if (!allowedChatIds.includes(chatId)) {
			console.log(chatId, " ==! ", allowedChatIds)
			return
		}
		console.log(chatId, " === ", allowedChatIds)
		const userId = match[1]
		const answerText = match[2]

		try {
			await bot.sendMessage(userId, answerText)

			console.log(userId, answerText)
			await bot.sendMessage(chatId, "Ответ отправлен пользователю.")
		} catch (error) {
			console.error(
				`Ошибка при отправке сообщения пользователю ${userId}:`,
				error
			)
			await bot.sendMessage(chatId, "Ошибка при отправке сообщения.")
		}
	})
}

module.exports = BotStart()
