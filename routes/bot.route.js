const Router = require("express")
const BotRouter = new Router()

const botController = require("../controllers/bot.controller")

BotRouter.post("/customer", botController.createUser)
BotRouter.post("/checker", botController.getChecker)
BotRouter.post("/message", botController.PaymentWithOpertor)
module.exports = BotRouter
