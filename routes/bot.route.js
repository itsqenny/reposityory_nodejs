const Router = require("express")
const BotRouter = new Router()

const botController = require("../controllers/bot.controller")

BotRouter.post("/customer", botController.createUser)

module.exports = BotRouter
