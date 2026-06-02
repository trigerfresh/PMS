const express = require('express')
const router = express.Router()

const roomController = require('../controllers/roomController')
const authMiddleware = require('../middleware/authMiddleware')

/* =========================
   CREATE ROOM
========================= */
router.post('/', authMiddleware, roomController.createRoom)

/* =========================
   GET ALL ROOMS
========================= */
router.get('/', authMiddleware, roomController.getRooms)

/* =========================
   GET ROOM BY ID
========================= */
// router.get('/:id', authMiddleware, roomController.getRoomById)

/* =========================
   UPDATE ROOM
========================= */
router.put('/:id', authMiddleware, roomController.updateRoom)

/* =========================
   DELETE ROOM (SOFT DELETE)
========================= */
router.delete('/:id', authMiddleware, roomController.deleteRoom)

router.get(
  '/available/:hotel_id',
  authMiddleware,
  roomController.getAvailableRooms,
)

router.get('/hotel/:hotel_id', authMiddleware, roomController.getRoomsByHotel)

module.exports = router
