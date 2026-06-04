const express = require('express')
const router = express.Router()
const upload = require('../utils/multer')

const controller = require('../controllers/subCategoriesController')

router.post(
  '/subcategory',
  upload.single('image'),
  controller.createSubcategory,
)

router.get('/subcategory/search', controller.searchSubcategories)
router.get('/subcategory/download-xlsx', controller.downloadSubcategoriesXlsx)
router.get('/subcategory', controller.getSubcategories)
router.put(
  '/subcategory/:id',
  upload.single('image'),
  controller.updateSubcategory,
)
router.delete('/subcategory/:id', controller.deleteSubcategory)
router.put('/subcategory/restore/:id', controller.restoreSubcategory)

module.exports = router
