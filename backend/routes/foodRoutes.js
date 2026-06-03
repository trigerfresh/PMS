const express = require('express')
const router = express.Router()

const foodController = require('../controllers/foodController')
const authMiddleware = require('../middleware/authMiddleware')
const upload = require('../utils/multer') // multer file

router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'img1', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
    { name: 'img3', maxCount: 1 },
    { name: 'img4', maxCount: 1 },
  ]),
  foodController.createFood,
)

router.get('/', authMiddleware, foodController.getFoods)

router.get('/:id', authMiddleware, foodController.getFoodById)

router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'img1', maxCount: 1 },
    { name: 'img2', maxCount: 1 },
    { name: 'img3', maxCount: 1 },
    { name: 'img4', maxCount: 1 },
  ]),
  foodController.updateFood,
)

router.delete('/:id', authMiddleware, foodController.deleteFood)

module.exports = router
