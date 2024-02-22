const bot = require("../app")
const token = require("../config/token")
const db = require("../../DB/db")
const description = require("../components/description")
const botController = require("../../controllers/bot.controller")

const ReferralBonus = () => {
	bot.onText(/\/start (.+)/, async (msg, match) => {
		const chatId = msg.chat.id
		const referralId = msg.from.id
		const referralName = msg.from.first_name
		const referralCode = match[1]

		try {
			if (referralId.toString() === referralCode.toString()) {
				bot.sendMessage(
					chatId,
					"Нельзя применять собственный реферальный код. Попробуйте пригласить друзей!"
				)
				return
			}

			const existingUser = await botController.getReferralId({
				referralCode,
			})

			if (!existingUser) {
				bot.sendMessage(
					chatId,
					"Данный реферальный код не существует. Пожалуйста, уточните правильный реферальный код."
				)
				return
			}

			const allUsersWithReferralId = await botController.getAnotherReferralId({
				referralId,
			})

			if (allUsersWithReferralId.length > 0) {
				bot.sendMessage(chatId, "Вы уже используете реферальный код.")
				return
			}

			const currentReferrals = existingUser.referralId
				? JSON.parse(existingUser.referralId)
				: []

			if (currentReferrals.some((ref) => ref.referralId === referralId)) {
				bot.sendMessage(
					chatId,
					"Этот реферальный код уже был использован данным пользователем. Реферальные коды можно использовать только один раз."
				)
				return
			}

			const newReferral = {
				referralId,
			}
			const updatedReferrals = [...currentReferrals, newReferral]

			await botController.updateReferralId({
				referralCode,
				updatedReferrals,
			})

			//console.log("Данные пользователя успешно обновлены.")

			bot.sendMessage(
				chatId,
				`Привет, ${referralName}! Ты перешел по реферальному коду: ${referralCode}`
			)
		} catch (error) {
			//console.error("Ошибка при обработке команды /start:", error)
			bot.sendMessage(chatId, "Произошла ошибка при обработке команды /start.")
		}
	})
}

module.exports = ReferralBonus()
