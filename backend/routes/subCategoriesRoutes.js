const express = require('express')
const router = express.Router()

const controller = require('../controllers/subCategoriesController')

router.post('/subcategory', controller.createSubcategory)
router.get('/subcategory', controller.getSubcategories)
router.put('/subcategory/:id', controller.updateSubcategory)
router.delete('/subcategory/:id', controller.deleteSubcategory)
router.put('/subcategory/restore/:id', controller.restoreSubcategory)

module.exports = router
