require("dotenv").config()
require("./Telegram/start/botStart")
require("./Telegram/photo/getPhoto")
require("./Telegram/referral/referralStart")
const express = require("express")
const axios = require("axios")
const crypto = require("crypto")
const productRouter = require("./routes/product.route")
const userRouter = require("./routes/user.route")
const botRouter = require("./routes/bot.route")
const PORT = process.env.PORT
const app = express()
app.use(express.json())

app.use("/api", productRouter, userRouter, botRouter)

app.post("/getLinks", async (req, res) => {
	const apikey = process.env.TOKEN_P2P
	const project_id = process.env.ID_P2P
	const order_id =
		Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 99999)
	const amount = 100.0
	const currency = "RUB"
	const data = {
		project_id: project_id,
		order_id: order_id,
		amount: amount,
		currency: currency,
	}
	const jsonData = JSON.stringify(data)
	const joinString = `${apikey}${order_id}${project_id}${amount}${currency}`

	const hash = crypto.createHash("sha512").update(joinString).digest("hex")

	const options = {
		method: "POST",
		url: "https://p2pkassa.online/api/v2/link",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + hash,
		},
		data: jsonData,
	}

	try {
		const response = await axios(options)
		console.log(response.data)
	} catch (error) {
		console.error(
			`Ошибка HTTP: ${JSON.stringify(
				error.response.status
			)}, Сообщение: ${JSON.stringify(error.response.data)}`
		)
	}
})

app.listen(PORT, () => console.log(`Сервер запущен на ${PORT} порте`))
