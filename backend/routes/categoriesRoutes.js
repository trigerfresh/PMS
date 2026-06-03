const express = require('express')
const router = express.Router()

const controller = require('../controllers/categoriesController')

router.post('/category', controller.createCategory)
router.get('/category', controller.getCategories)
router.put('/category/:id', controller.updateCategory)
router.delete('/category/:id', controller.deleteCategory)
router.put('/category/restore/:id', controller.restoreCategory)

module.exports = router
