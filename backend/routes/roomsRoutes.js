const express = require('express')
const router = express.Router()

const roomController = require('../controllers/roomsController')
const upload = require('../utils/multer')

// ================= CREATE ROOM (WITH FILES) =================
router.post(
  '/rooms',
  upload.fields([
    { name: 'room_photo1', maxCount: 1 },
    { name: 'room_photo2', maxCount: 1 },
    { name: 'room_photo3', maxCount: 1 },
    { name: 'room_photo4', maxCount: 1 },
    { name: 'room_video', maxCount: 1 },
  ]),
  roomController.createRoom,
)

// ================= GET ALL ROOMS =================
router.get('/rooms', roomController.getRooms)

router.get('/rooms/export', roomController.exportRooms)

// Deleted Rooms
router.get('/rooms/deleted', roomController.getDeletedRooms)

// Restore Room
router.put('/rooms/restore/:roomId', roomController.restoreRoom)

//search routes
router.get('/rooms/search', roomController.searchRooms)

router.get('/rooms/stats', roomController.getRoomStats)

// ================= GET ROOM BY ID =================
router.get('/rooms/:id', roomController.getRoomById)

// ================= UPDATE ROOM (WITH FILES) =================
router.put(
  '/rooms/:roomId',
  upload.fields([
    { name: 'room_photo1', maxCount: 1 },
    { name: 'room_photo2', maxCount: 1 },
    { name: 'room_photo3', maxCount: 1 },
    { name: 'room_photo4', maxCount: 1 },
    { name: 'room_video', maxCount: 1 },
  ]),
  roomController.updateRoom,
)

router.get('/rooms/floor/:floorId', roomController.getRoomsByFloor)

// ================= DELETE ROOM =================
router.delete('/rooms/:roomId', roomController.deleteRoom)

module.exports = router
