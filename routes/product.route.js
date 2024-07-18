const Router = require("express")
const router = new Router()
const productController = require("../controllers/product.controller")

router.get("/products/", productController.getProducts)
router.get("/v1/product/:id", productController.getProductV1)
router.get("/v1/products/", productController.getProductsV1)
router.get("/products/v1/:id", productController.getProduct)
router.get("/product", productController.getProductsLimit)
router.get("/v1/limit", productController.getProductsLimitV1)
router.get("/filter", productController.getFilter)
router.post("/create", productController.createPayment)
module.exports = router
