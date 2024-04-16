require("dotenv").config()
const db = require("../DB/db")
const axios = require("axios")
const crypto = require("crypto")
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
		// Данные держателя кассы
		const apikey = process.env.TOKEN_P2P
		const project_id = process.env.ID_P2P
		const currency = "RUB"
		let status = []
		let paymentId = []
		let ProductOrder = []
		const getUserBonus = newBonus
		const saveUserBonus = saveBonus
		const allowedUserId = userId
		if (userId !== allowedUserId) {
			return res.status(403).json({
				error: "Доступ запрещен",
				message: "Вы не авторизованы",
			})
		}

		try {
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
				//console.log(userFio, userAdress, phoneNumber, userCity)
				const data = {
					project_id: project_id,
					apikey: apikey,
					order_id: order_id,
					amount: price,
					currency: currency,
				}
				const jsonData = JSON.stringify(data)
				const joinString = `${apikey}${order_id}${project_id}${price}${currency}`

				const hash = crypto
					.createHash("sha512")
					.update(joinString)
					.digest("hex")

				const options = {
					method: "POST",
					url: "https://p2pkassa.online/api/v2/link",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${hash}`,
					},
					data: jsonData,
				}
				//console.log(options)

				try {
					const response = await axios(options)
					console.log(`response link: ${response.data.link}`)
					console.log(`response id: ${response.data.id}`)
					if (response && response.data.link && response.data.id) {
						const paymentUrl = response.data.link
						paymentId = response.data.id

						const dataUpdate = {
							id: paymentId,
							order_id: order_id,
							project_id: project_id,
						}

						const jsonDataUpdate = JSON.stringify(dataUpdate)
						//console.log(jsonDataUpdate)
						const joinStringUpdate = `${apikey}${paymentId}${order_id}${project_id}`
						//console.log(joinStringUpdate)
						const hashUpdate = crypto
							.createHash("sha512")
							.update(joinStringUpdate)
							.digest("hex")

						const optionsUpdate = {
							method: "POST",
							url: "https://p2pkassa.online/api/v2/getPayment",
							headers: {
								"Content-Type": "application/json",
								Authorization: `Bearer ${hashUpdate}`,
							},
							data: jsonDataUpdate,
						}
						//console.log(JSON.stringify(optionsUpdate))
						try {
							const responseUpdate = await axios(optionsUpdate)

							//console.log(`response: ${JSON.stringify(responseUpdate.data)}`)

							status = responseUpdate.data.status
							console.log("Статус оплаты:", status)
							const userOrderString = user.rows[0].userOrder
							console.log(`order: ${userOrderString}`)
							let currentOrders = userOrderString
								? JSON.parse(userOrderString)
								: []
							console.log(`currentOrders: ${currentOrders}`)
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
							console.log(`newOrder : ${newOrder}`)
							const updatedOrders = currentOrders.concat(newOrder)
							console.log("currentOrders before update:", updatedOrders)

							await db.query(
								'UPDATE "Users" SET "userOrder" = $1 WHERE "userId" = $2',
								[JSON.stringify(updatedOrders), userId]
							)

							console.log("Заказ успешно добавлен.")

							console.log(`paymentUrl: ${paymentUrl}`)
							return res.json({ paymentUrl })
						} catch (error) {
							console.error(`Отстутствует ссылка в оплате`)
						}
					} else {
						console.log(`Не авторизован`)
					}
				} catch (error) {
					console.error(
						`Ошибка HTTP: ${JSON.stringify(
							error.response.status
						)}, Сообщение: ${JSON.stringify(error.response.data)}`
					)
				}
			}
		} catch (e) {
			console.error(`Ошибка авторизации`)
		}
	}
}

module.exports = new ProductController()
