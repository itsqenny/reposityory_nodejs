require("dotenv").config()
const db = require("../DB/db")
const TelegramBot = require("node-telegram-bot-api")
const crypto = require("crypto")
const bot = require("../Telegram/app")

class BotController {
	async createUser({ userId, first_name, last_name, username }) {
		const existingUser = await db.query(
			'SELECT * FROM "Users" WHERE "userId" = $1',
			[userId]
		)

		if (existingUser.rows.length > 0) {
			const updateUser = await db.query(
				'UPDATE "Users" SET "first_name" = $2, "last_name" = $3, "username" = $4 WHERE "userId" = $1 RETURNING *',
				[userId, first_name, last_name, username]
			)

			if (!existingUser.rows[0].startBonus) {
				const updateBonus = await db.query(
					'UPDATE "Users" SET "userBonus" = 1000, "startBonus" = true WHERE "userId" = $1 RETURNING *',
					[userId]
				)

				return updateBonus.rows[0]
			} else {
				return updateUser.rows[0]
			}
		} else {
			// Если пользователь не существует, создаем нового с бонусами
			const newUser = await db.query(
				'INSERT INTO "Users" ("userId", "first_name", "last_name", "username", "userBonus", "startBonus", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, 500, true, NOW(), NOW()) RETURNING *',
				[userId, first_name, last_name, username]
			)

			return newUser.rows[0]
		}
	}
	async getPhotoId({ userId, filePath }) {
		const user = await db.query(
			'INSERT INTO "Users" ("userId", "filePath", "createdAt", "updatedAt") values ($1, $2, NOW(), NOW()) ON CONFLICT ("userId") DO UPDATE SET "filePath" = $2 RETURNING *',
			[userId, filePath]
		)
		return user.rows[0]
	}
	async getReferralId({ referralCode }) {
		const referral = await db.query(
			'SELECT * FROM "Users" WHERE "userId" = $1',
			[referralCode.toString()]
		)
		return referral.rows[0]
	}

	async getAnotherReferralId({ referralId }) {
		const another = await db.query(
			'SELECT * FROM "Users" WHERE "referralId" LIKE $1',
			[`%${referralId}%`]
		)
		return another.rows
	}

	async updateReferralId({ referralCode, updatedReferrals }) {
		await db.query('UPDATE "Users" SET "referralId" = $1 WHERE "userId" = $2', [
			JSON.stringify(updatedReferrals),
			referralCode.toString(),
		])
	}
	async getChecker(req, res) {
		// Ваш код для POST-запроса
		const inData = req.body
		console.log(JSON.stringify(inData))
		const apikey = process.env.TOKEN_P2P
		const project_id = process.env.ID_P2P
		const joinString = `${apikey}${inData.id}${
			inData.order_id
		}${project_id}${inData.amount.toFixed(2)}${inData.currency}`
		const sign = crypto.createHash("sha256").update(joinString).digest("hex")

		if (sign !== inData.sign) {
			return res.status(400).send("Неверная подпись")
		}

		if (
			data !== undefined &&
			id !== undefined &&
			order_id !== undefined &&
			createDateTime !== undefined &&
			amount !== undefined
		) {
			// Платеж прошел успешно, проводите операции по обработке платежа
			console.log("Оплачено")

			// Отправляем статус только если все поля определены
			res.send("OK")

			// Находим пользователя с совпадающими данными в userOrder
			const user = await db.query(
				'SELECT * FROM "Users" WHERE "userOrder" LIKE $1',
				[`%${inData.order_id}%`]
			)

			if (user) {
				//console.log(`chatId: ${JSON.stringify(user.rows[0].userId)}`)
				const chatId = user.rows[0].userId
				const message = `${data}`

				// Отправляем сообщение пользователю
				bot.sendMessage(chatId, message)

				let currentOrders = user.userOrder ? JSON.parse(user.userOrder) : []

				// Обновляем статус заказов с соответствующим order_id
				const updatedOrders = currentOrders.map((order) => {
					if (order.order_id === order_id) {
						return { ...order, status: "PAID" }
					}
					return order
				})

				// Обновляем запись в таблице Users
				await db.query(
					'UPDATE "Users" SET "userOrder" = $1 WHERE "userId" = $2',
					[JSON.stringify(updatedOrders), user.userId]
				)
				console.log("Статус заказа успешно обновлен.")
			}
		}
	}
}

module.exports = new BotController()
