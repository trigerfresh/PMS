const express = require('express')
const router = express.Router()
const FoodOrderController = require('../controllers/foodOrderController')

// Define routes for food order CRUD
router.post('/food-orders', FoodOrderController.createFoodOrder)
router.get('/food-orders', FoodOrderController.getFoodOrders)
router.get('/food-orders/:id', FoodOrderController.getFoodOrderById)
router.put('/food-orders/:id', FoodOrderController.updateFoodOrder)
router.delete('/food-orders/:id', FoodOrderController.deleteFoodOrder)
router.put('/food-orders/restore/:id', FoodOrderController.restoreFoodOrder)

module.exports = router
