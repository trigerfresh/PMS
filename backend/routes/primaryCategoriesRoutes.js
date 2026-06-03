const express = require('express')
const router = express.Router()

const controller = require('../controllers/primaryCategories')

router.post('/primary-category', controller.createPrimaryCategory)
router.get('/primary-category', controller.getPrimaryCategories)
router.put('/primary-category/:id', controller.updatePrimaryCategory)
router.delete('/primary-category/:id', controller.deletePrimaryCategory)
router.put('/primary-category/restore/:id', controller.restorePrimaryCategory)

module.exports = router
