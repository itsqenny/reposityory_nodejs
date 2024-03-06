const db = require("../DB/db")
class UserController {
	async getUserId(req, res) {
		const { id } = req.params
		const customer = await db.query(
			'SELECT * FROM "Users" WHERE "userId" = $1',
			[id]
		)

		res.json(customer.rows[0])
	}
	async getUserSubscription(req, res) {
		const { id } = req.params
		const subscription = await db.query(
			'SELECT "userId","userRank" FROM "Users" WHERE "userId" = $1',
			[id]
		)

		res.json(subscription.rows[0])
	}
	async getUserBonus(req, res) {
		const { id } = req.params
		const bonus = await db.query(
			'SELECT "userId","userBonus" FROM "Users" WHERE "userId" = $1',
			[id]
		)

		res.json(bonus.rows[0])
	}
	async getUserBasket(req, res) {
		const { id } = req.params
		try {
			const user = await db.query(
				'SELECT "userId", "userOrder" FROM "Users" WHERE "userId" = $1',
				[id]
			)

			if (user.rows.length > 0) {
				const userOrderString = user.rows[0].userOrder || "[]"
				const userOrder = JSON.parse(userOrderString)

				if (Array.isArray(userOrder)) {
					const waitOrders = userOrder.filter(
						(order) => order.status === "WAIT"
					)

					res.json({ userId: user.rows[0].userId, userOrder: waitOrders })
				} else {
					res
						.status(500)
						.json({ error: "Формат данных в поле userOrder некорректен" })
				}
			} else {
				res.status(404).json({ error: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при выполнении запроса:", error)
			res.status(500).json({ error: "Ошибка сервера" })
		}
	}
	async getUserPaid(req, res) {
		const { id } = req.params
		try {
			const user = await db.query(
				'SELECT "userId", "userOrder" FROM "Users" WHERE "userId" = $1',
				[id]
			)

			if (user.rows.length > 0) {
				const userOrderString = user.rows[0].userOrder || "[]"
				const userOrder = JSON.parse(userOrderString)

				if (Array.isArray(userOrder)) {
					const waitOrders = userOrder.filter(
						(order) => order.status === "PAID"
					)

					res.json({ userId: user.rows[0].userId, userOrder: waitOrders })
				} else {
					res
						.status(500)
						.json({ error: "Формат данных в поле userOrder некорректен" })
				}
			} else {
				res.status(404).json({ error: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при выполнении запроса:", error)
			res.status(500).json({ error: "Ошиб ~ка сервера" })
		}
	}
	async getUserData(req, res) {
		const { userId } = req.params
		try {
			const user = await db.query(
				'SELECT "userId", "userOrder" FROM "Users" WHERE "userId" = $1',
				[userId]
			)
			res.json({
				userId: user.rows[0].userId,
				phoneNumber: user.rows[0].phoneNumber,
				userFio: user.rows[0].userFio,
				userAdress: user.rows[0].userAdress,
				userCity: user.rows[0].userCity,
			})
		} catch (e) {
			res.status(404).json({
				error: "Пользователь не найден",
			})
		}
	}
	async getUserStatus(req, res) {
		const { userId, order_id } = req.query
		console.log(`data: ${userId}, ${order_id}`)
		try {
			const user = await db.query(
				'SELECT "userId", "userOrder" FROM "Users" WHERE "userId" = $1',
				[userId]
			)

			if (user.rows.length > 0) {
				const userOrderString = user.rows[0].userOrder || "[]"
				const userOrder = JSON.parse(userOrderString)
				console.log(userOrder)
				if (Array.isArray(userOrder)) {
					const status = userOrder.find((order) => order.order_id === order_id)

					if (status) {
						res.json({
							userId: user.rows[0].userId,
							order_id: order_id,
							status: status.status,
						})
					} else {
						res.json({
							userId: user.rows[0].userId,
							order_id: order_id,
							status: "not found",
						})
					}
				} else {
					res
						.status(500)
						.json({ error: "Формат данных в поле userOrder некорректен" })
				}
			} else {
				res.status(404).json({ error: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при выполнении запроса:", error)
			res.status(500).json({ error: "Ошибка сервера" })
		}
	}
	async getUserPhotoFile(req, res) {
		const { id } = req.params
		const photo = await db.query(
			'SELECT "filePath" FROM "Users" WHERE "userId" = $1',
			[id]
		)

		if (photo.rows.length > 0 && photo.rows[0].filePath) {
			const filePath = photo.rows[0].filePath

			// Отправляем файл
			res.sendFile(filePath)
		} else {
			// Возвращаем ошибку, если файл не найден
			res.status(404).send("File not found")
		}
	}
	async getUserPhoto(req, res) {
		const { id } = req.params
		const photo = await db.query(
			'SELECT "filePath" FROM "Users" WHERE "userId" = $1',
			[id]
		)
		const baseUrl = `https://zipperconnect.space/api/customer/${id}/settings/photo`
		if (photo.rows.length > 0 && photo.rows[0].filePath) {
			const filePath = photo.rows[0].filePath
			const fullUrl = `${baseUrl}`
			// Отправляем файл
			res.json({ userId: id, img: fullUrl })
		} else {
			// Возвращаем ошибку, если файл не найден
			res.status(404).send("File not found")
		}
	}
	async getUserSettings(req, res) {
		const { userId, userFio, phoneNumber, userAdress, userCity } = req.body
		console.log(userId, userFio, phoneNumber, userAdress, userCity)
		const user = await db.query(
			'INSERT INTO "Users" ("userId", "userFio", "phoneNumber","userAdress","userCity","createdAt","updatedAt") values ($1, $2, $3, $4, $5, NOW(), NOW() ) ON CONFLICT ("userId") DO UPDATE SET "userFio" = $2, "phoneNumber" = $3, "userAdress" = $4, "userCity" = $5, "createdAt" = NOW(), "updatedAt" = NOW() RETURNING *',
			[userId, userFio, phoneNumber, userAdress, userCity]
		)
		res.json(user.rows)
	}
	async getUserSettingsId(req, res) {
		const { id } = req.params
		const settings = await db.query(
			'SELECT "userId","userAdress","userFio","userCity", "phoneNumber" FROM "Users" WHERE "userId" = $1',
			[id]
		)

		res.json(settings.rows[0])
	}
	async getUserBasketDelete(req, res) {
		const { userId, orderId } = req.query
		const user = await db.query(
			'SELECT "userOrder" FROM "Users" WHERE "userId" = $1',
			[userId]
		)
		console.log(`userId: ${userId}, orderId: ${orderId}`)
		try {
			if (user.rows.length > 0) {
				// Check if any rows were returned
				const userOrderArray = JSON.parse(user.rows[0].userOrder)

				// Находим первый элемент с определенным order_id
				const itemToRemove = userOrderArray.find(
					(item) => item.order_id === orderId
				)

				if (itemToRemove) {
					// Получаем saveUserBonus из элемента
					const saveUserBonus = Number(itemToRemove.saveBonus) || 0
					const getUserBonus = Number(itemToRemove.newBonus) || 0

					if (getUserBonus === 0) {
						// Обновляем userBonus в базе данных
						await User.update(
							{ userBonus: Number(user.userBonus) + saveUserBonus },
							{ where: { userId: userId.toString() } }
						)
					}
					// Удаляем элемент из массива
					userOrderArray.splice(userOrderArray.indexOf(itemToRemove), 1)

					// Обновляем userOrder в базе данных
					await db.query(
						'UPDATE "Users" SET "userOrder" = $1 WHERE "userId" = $2',
						[JSON.stringify(userOrderArray), userId]
					)

					res.status(200).json({
						success: true,
						message: "Товар успешно удален из корзины",
					})
				} else {
					res.status(404).json({
						error:
							"Товар с указанным order_id не найден в корзине пользователя",
					})
				}
			} else {
				res.status(404).json({ error: "Пользователь не найден" })
			}
		} catch (error) {
			console.error("Ошибка при удалении товара", error)
			res.status(500).json({ error: "Внутренняя ошибка сервера" })
		}
	}
}

module.exports = new UserController()
