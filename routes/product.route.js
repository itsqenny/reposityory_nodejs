const Router = require("express")
const router = new Router()
const logicController = require("../controllers/logic.controller")
const productController = require("../controllers/product.controller")

router.get("/products/", productController.getProducts)
router.get("/products/:id", productController.getProduct)
router.get("/product", productController.getProductsLimit)
router.get("/filter", productController.getFilter)
router.post("/create", productController.createPayment)

router.post("/test", logicController.getBonus)
module.exports = router
