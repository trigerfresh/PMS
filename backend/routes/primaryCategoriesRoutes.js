const express = require('express')
const router = express.Router()
const upload = require('../utils/multer')

const controller = require('../controllers/primaryCategories')

router.post(
  '/primary-category',
  upload.single('image'),
  controller.createPrimaryCategory,
)

router.put(
  '/primary-category/:id',
  upload.single('image'),
  controller.updatePrimaryCategory,
)

router.get('/primary-category/search', controller.searchPrimaryCategories)
router.get('/primary-category/export/excel', controller.exportExcel)

router.get('/primary-category', controller.getPrimaryCategories)
router.delete('/primary-category/:id', controller.deletePrimaryCategory)
router.put('/primary-category/restore/:id', controller.restorePrimaryCategory)

module.exports = router
