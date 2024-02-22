require("dotenv").config()
require("./Telegram/start/botStart")
require("./Telegram/photo/getPhoto")
require("./Telegram/referral/referralStart")
const express = require("express")
const productRouter = require("./routes/product.route")
const userRouter = require("./routes/user.route")
const botRouter = require("./routes/bot.route")
const PORT = process.env.PORT
const app = express()
app.use(express.json())

app.use("/api", productRouter, userRouter, botRouter)
app.listen(PORT, () => console.log(`Сервер запущен на ${PORT} порте`))
