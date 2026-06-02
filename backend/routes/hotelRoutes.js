const express = require('express')
const router = express.Router()

const hotelController = require('../controllers/hotelController')
const authMiddleware = require('../middleware/authMiddleware')

const multer = require('multer')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage })

router.post(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'thumbnail_image', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  hotelController.createHotel,
)

router.get('/', authMiddleware, hotelController.getHotels)

router.get('/export', authMiddleware, hotelController.exportHotels)

router.get('/:id', authMiddleware, hotelController.getHotelById)

router.put(
  '/:id',
  authMiddleware,
  upload.fields([
    { name: 'thumbnail_image', maxCount: 1 },
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
  ]),
  hotelController.updateHotel,
)

// GET ALL HOTELS + SEARCH + DATE FILTER
router.get('/', authMiddleware, hotelController.getHotels)

// SOFT DELETE
router.delete('/:id', authMiddleware, hotelController.deleteHotel)

module.exports = router
