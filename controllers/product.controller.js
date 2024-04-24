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
	async createRequisites(req, res) {
		const shopId = process.env.ID_FREEKASSA
		const apiKey = process.env.TOKEN_FREEKASSA
		const currency = "RUB"
		const amount = "1000"
		const nonce = Math.floor(Date.now() / 1000)
		const paymentId = "85231232"
		const i = "4"

		const data = {
			shopId: shopId,
			apiKey: apiKey,
			paymentId: paymentId,
			nonce: nonce,
			i: i,
			amount: amount,
			currency: currency,
		}

		const body = Object.keys(data)
			.sort()
			.reduce((acc, key) => {
				acc[key] = data[key]
				return acc
			}, {})

		const signature = crypto
			.createHmac("sha256", apiKey)
			.update(Object.values(body).join("|"))
			.digest("hex")

		const requestData = {
			...body,
			signature,
		}

		try {
			const response = await axios.post(
				"https://api.freekassa.ru/v1/withdrawals/create",
				requestData
			)
			res.json(response.data)
		} catch (error) {
			console.error(error)
			res.status(500).json({ error: "Internal Server Error" })
		}
	}
}

module.exports = new ProductController()
