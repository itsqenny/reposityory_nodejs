require("dotenv").config()
const db = require("../DB/db")
const axios = require("axios")
const crypto = require("crypto")
const { createHash } = crypto

class ProductController {
	async getProducts(req, res) {
		const products = await db.query('SELECT * FROM "Sneakers"')
		res.json(products.rows)
	}
	async getProduct(req, res) {
		const { id } = req.params

		const product = await db.query('SELECT * FROM "Sneakers" WHERE id = $1', [
			id,
		])

		res.json(product.rows[0])
	}
	async getProductsLimit(req, res) {
		try {
			const { page = 1, limit = 50 } = req.query
			const offset = (page - 1) * limit

			const result = await db.query(
				'SELECT * FROM "Sneakers" LIMIT $1 OFFSET $2',
				[limit, offset]
			)

			res.json(result.rows)
		} catch (error) {
			console.error("Error fetching products:", error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
	async getFilter(req, res) {
		try {
			const {
				page = 1,
				limit = 50,
				name,
				brand,
				category,
				size,
				from,
				to,
			} = req.query
			const offset = (page - 1) * limit
			const conditions = []
			const values = []

			if (name) {
				conditions.push('"name" ILIKE $' + (values.length + 1))
				values.push("%" + name + "%")
			}

			if (brand) {
				conditions.push('"brand" = $' + (values.length + 1))
				values.push(brand)
			}

			if (category) {
				conditions.push('"category" = $' + (values.length + 1))
				values.push(category)
			}

			if (size) {
				conditions.push(`jsonb_exists("size", '${size}')`)
			}

			if (from && !to) {
				conditions.push('"price" >= $' + (values.length + 1))
				values.push(from)
			} else if (!from && to) {
				conditions.push('"price" <= $' + (values.length + 1))
				values.push(to)
			} else if (from && to) {
				conditions.push(
					'"price" BETWEEN $' +
						(values.length + 1) +
						" AND $" +
						(values.length + 2)
				)
				values.push(from)
				values.push(to)
			}

			const whereClause =
				conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : ""

			const query = `
				SELECT *
				FROM "Sneakers"
				${whereClause}
				OFFSET $${values.length + 1}
				LIMIT $${values.length + 2}
			`

			values.push(offset)
			values.push(limit)

			const result = await db.query(query, values)
			console.log(result)
			res.json(result.rows)
		} catch (error) {
			console.error("Ошибка при получении продуктов:", error)
			res
				.status(500)
				.json({ error: "Внутренняя ошибка сервера", details: error.message })
		}
	}
	async createPayment(req, res) {
		//const { name, price, size, order_id, productId } = req.body
		const apikey = process.env.TOKEN_P2P
		const project_id = process.env.ID_P2P
		const order_id =
			Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 99999) // Ваш номер заказа
		const amount = 100.0 // Сумма платежа
		const currency = "RUB" // Валюта платежа
		const data = {
			project_id: project_id,
			order_id: order_id,
			amount: amount,
			currency: currency,
		}

		const jsonData = JSON.stringify(data)

		// Создаем аутентификационный ключ
		const joinString = `${apikey}${order_id}${project_id}${amount}${currency}`
		console.log(`${joinString} i eshe ${JSON.stringify(joinString)}`)
		const hash = crypto
			.createHash("sha512")
			.update(JSON.stringify(joinString))
			.digest("hex")
		console.log("hash " + hash)
		// Отправляем запрос
		const url = "https://p2pkassa.online/api/v2/link"
		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${hash}`,
		}

		console.log("header " + JSON.stringify(headers))
		try {
			const getPay = await axios.post(url, jsonData, {
				headers: headers,
			})
			console.log("getPay " + getPay)
			const result = getPay.data
			console.log(result)
			const resultString = JSON.stringify(response)
			console.log(resultString)
		} catch (error) {
			console.error(
				`Ошибка HTTP: ${JSON.stringify(
					error.response.status
				)}, Сообщение: ${JSON.stringify(error.response.data)}`
			)
		}
	}
	async getPayment(req, res) {
		const {
			name,
			price,
			size,
			userId,
			order_id,
			productId,
			time,
			remainingBonus,
			saveBonus,
			newBonus,
		} = req.body

		let status = []
		let paymentId = []
		let ProductOrder = []

		const allowedUserId = userId
		if (userId !== allowedUserId) {
			return res.status(403).json({
				error: "Доступ запрещен",
				message: "Вы не имеете разрешения на выполнение этой операции.",
			})
		}

		try {
			const apikey = process.env.TOKEN_P2P
			const project_id = process.env.ID_P2P
			const currency = "RUB"
			const ProductName = name
			const ProductSize = size
			const saveUserBonus = saveBonus
			const getUserBonus = newBonus
			ProductOrder = order_id
			const ProductPrice = price

			// Поиск пользователя в базе данных
			const user = await db.query('SELECT * FROM "Users" WHERE "userId" = $1', [
				userId,
			])

			if (user) {
				const currentBonus = user.rows[0].userBonus || 0
				const changeBonus = remainingBonus
				const updatedBonus = parseInt(changeBonus, 10)

				if (getUserBonus === 0) {
					const updateQuery =
						'UPDATE "Users" SET "userBonus" = $1 WHERE "userId" = $2'
					await db.query(updateQuery, [updatedBonus, userId])
				}
				// Извлекаем данные пользователя
				const userId = user.rows[0].userId
				const userFio = user.rows[0].userFio || "Не указано"
				const userAdress = user.rows[0].userAdress || "Не указано"
				const phoneNumber = user.rows[0].phoneNumber || "Не указано"
				const userCity = user.rows[0].userCity || "Не указано"
				console.log(`DataPayemnt: ${JSON.stringify(user.rows[0])}`)
				const options = `Название товара: ${ProductName}, 
                      размер: ${ProductSize}, 
                      ФИО: ${userFio}, 
                      Номер для связи ${phoneNumber}
                      Город: ${userCity},
                      Адрес доставки: ${userAdress}`

				const dataToSend = {
					project_id: project_id,
					order_id: ProductOrder,
					amount: ProductPrice,
					currency: currency,
					data: JSON.stringify(options),
				}
				const jsonData = JSON.stringify(dataToSend)
				const joinString = `${apikey}${ProductOrder}${productId}${ProductPrice}${currency}`
				const authToken = createHash("sha512").update(joinString).digest("hex")
				const url = "https://p2pkassa.online/api/v2/link"
				const headers = {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				}
				const response = await fetch(url, {
					method: "POST",
					body: jsonData,
					headers: headers,
				})
				const result = await response.json()
				console.log(`result: ${JSON.stringify(result)}`)
				if (result && result.link && result.id) {
					// Создаем URL для второго запроса
					const paymentUrl = result.link
					paymentId = result.id
					console.log(paymentUrl)
					console.log(paymentId)
					// Отправляем второй POST-запрос

					const dataToPayment = {
						id: paymentId,
						project_id: project_id,
						apikey: apikey,
					}
					const getPayment = await axios.post(
						"https://p2pkassa.online/api/v1/getPayment",
						dataToPayment,
						headers
					)
					const resGetPayment = getPayment.data

					console.log(`resGetPayment : ${resGetPayment}`)

					const match = resGetPayment.match(/\"status\":\"([^"]+)\"/)
					status = match ? match[1] : null

					console.log("Статус оплаты:", status)
					const userOrderString = user.rows[0].userOrder
					console.log("userOrderString:", userOrderString)

					let currentOrders = userOrderString ? JSON.parse(userOrderString) : []
					// Добавьте новый заказ к существующему значению
					const newOrder = {
						id: productId,
						name: name,
						order_id: order_id,
						price: price,
						size: size,
						status: status,
						time: time,
						saveBonus: saveUserBonus,
						newBonus: getUserBonus,
					}

					const updatedOrders = currentOrders.concat(newOrder)
					console.log("currentOrders before update:", currentOrders)
					// Обновляем запись в таблице Users
					await db.query(
						'UPDATE "Users" SET "userOrder" = $1 WHERE "userId" = $2',
						[JSON.stringify(updatedOrders), userId]
					)

					console.log("Заказ успешно добавлен.")

					// Создаем URL для второго запроса
					// Отправляем второй POST-запрос
					return res.json({ paymentUrl })
				} else {
					console.log("Отсутствуют данные id и link в ответе")
				}
			} else {
				// Если пользователь не найден, обработка ошибки или возврат 404
				return res
					.status(400)
					.json({ error: "Ошибка", message: "Пользователь не найден." })
			}
		} catch (error) {
			// Обработка ошибки
			console.error(error)
			return res
				.status(500)
				.json({ error: "Ошибка", message: "Внутренняя ошибка сервера." })
		}
	}
	async getPaymentSubscription(req, res) {
		const { name, price, userId, order_id, productId, time } = req.body
		console.log(name, price, userId, order_id, productId, time)
		let status = []
		let paymentId = []
		let ProductOrder = []

		const allowedUserId = userId
		if (userId !== allowedUserId) {
			return res.status(403).json({
				error: "Доступ запрещен",
				message: "Вы не имеете разрешения на выполнение этой операции.",
			})
		}

		try {
			const apikey = process.env.TOKEN_P2P
			const project_id = process.env.ID_P2P
			const ProductName = name
			ProductOrder = order_id
			const ProductPrice = price
			console.log(ProductPrice)
			console.log(ProductOrder)
			console.log(ProductName)
			const config = {
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
			}
			const user = await db.query('SELECT * FROM "Users" WHERE "userId" = $1', [
				userId,
			])

			if (user) {
				const userId = user.rows[0].userId
				const userFio = user.rows[0].userFio || "Не указано"
				const userAdress = user.rows[0].userAdress || "Не указано"
				const phoneNumber = user.rows[0].phoneNumber || "Не указано"
				const userCity = user.rows[0].userCity || "Не указано"
				console.log(`DataPayemnt: ${JSON.stringify(user.rows[0])}`)
				const desc = `Вид подписки: ${ProductName}, 
                      ФИО: ${userFio}, 
                      Номер для связи ${phoneNumber}`
				const params = `
      Поздравляем с покупкой!
Теперь у вас 🧾 ${ProductName} навсегда
WORLDSTUFF снова ждет ваших заказов! ⚡`

				const dataToSend = {
					project_id: project_id,
					order_id: ProductOrder, // Используйте order_id из req.body
					amount: ProductPrice,
					apikey: apikey,
					desc: desc,
					data: params,
				}

				const response = await axios.post(
					"https://p2pkassa.online/api/v1/link",
					dataToSend,
					config
				)
				const result = response.data
				console.log(result)
				if (result && result.link && result.id) {
					// Создаем URL для второго запроса
					const paymentUrl = result.link
					paymentId = result.id
					console.log(paymentUrl)
					console.log(paymentId)
					// Отправляем второй POST-запрос

					const dataToPayment = {
						id: paymentId,
						project_id: project_id,
						apikey: apikey,
					}
					const getPayment = await axios.post(
						"https://p2pkassa.online/api/v1/getPayment",
						dataToPayment,
						config
					)
					const resGetPayment = getPayment.data
					const resGetPaymentString = JSON.stringify(resGetPayment)

					console.log(`resGetPayment : ${resGetPaymentString}`)

					const match = resGetPaymentString.match(/\"status\":\"([^"]+)\"/)
					status = match ? match[1] : null

					console.log("Статус оплаты:", status)
					const userOrderString = user.rows[0].userSplit
					console.log("userOrderString:", userOrderString)

					let currentOrders = userOrderString ? JSON.parse(userOrderString) : []
					// Добавьте новый заказ к существующему значению
					const newOrder = {
						id: productId,
						name: name,
						order_id: order_id,
						price: price,
						status: status,
						time: time,
					}

					const updatedOrders = currentOrders.concat(newOrder)
					console.log("currentOrders before update:", currentOrders)
					// Обновляем запись в таблице Users
					await db.query(
						'UPDATE "Users" SET "userSplit" = $1 WHERE "userId" = $2',
						[JSON.stringify(updatedOrders), userId]
					)

					console.log("Заказ успешно добавлен.")

					// Создаем URL для второго запроса
					// Отправляем второй POST-запрос
					return res.json({ paymentUrl })
				} else {
					console.log("Отсутствуют данные id и link в ответе")
				}
			} else {
				// Если пользователь не найден, обработка ошибки или возврат 404
				return res
					.status(400)
					.json({ error: "Ошибка", message: "Пользователь не найден." })
			}
		} catch (error) {
			// Обработка ошибки
			console.error(error)
			return res
				.status(500)
				.json({ error: "Ошибка", message: "Внутренняя ошибка сервера." })
		}
	}
}

module.exports = new ProductController()
