const Router = require("express")
const router = new Router()
const productController = require("../controllers/product.controller")

router.get("/products/", productController.getProducts)
router.get("/products/:id", productController.getProductV1)
router.get("/products/v1/", productController.getProductsV1)
router.get("/products/v1/:id", productController.getProduct)
router.get("/product", productController.getProductsLimit)
router.get("/filter", productController.getFilter)
router.post("/create", productController.createPayment)
module.exports = router
