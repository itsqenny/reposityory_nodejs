const Router = require("express")
const UserRouter = new Router()

const userController = require("../controllers/user.controller")

UserRouter.get("/customer/:id", userController.getUserId)
UserRouter.get("/customer/:id/settings/photo", userController.getUserPhotoFile)
UserRouter.get("/customer/:id/photo", userController.getUserPhoto)
UserRouter.get("/customer/:id/subscription", userController.getUserSubscription)
UserRouter.get("/customer/:id/bonus", userController.getUserBonus)
UserRouter.get("/customer/:id/basket", userController.getUserBasket)
UserRouter.get("/customer/:id/paid", userController.getUserPaid)
UserRouter.get("/customer/:id/settings", userController.getUserSettingsId)
UserRouter.get("/status", userController.getUserStatus)
UserRouter.post("/customer/settings", userController.getUserSettings)
UserRouter.post("/customer/basket/delete", userController.getUserBasketDelete)
module.exports = UserRouter
