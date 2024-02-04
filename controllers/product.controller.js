const db = require("../DB/db")
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
}

module.exports = new ProductController()
