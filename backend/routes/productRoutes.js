const express = require('express')
const router = express.Router()

const upload = require('../utils/multer')
const controller = require('../controllers/productController')

// CREATE PRODUCT
router.post(
  '/product',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  controller.createProduct,
)

// GET
router.get('/product', controller.getProducts)

// UPDATE
router.put(
  '/product/:id',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  controller.updateProduct,
)

// DELETE
router.delete('/product/:id', controller.deleteProduct)

// RESTORE
router.put('/product/restore/:id', controller.restoreProduct)

module.exports = router
