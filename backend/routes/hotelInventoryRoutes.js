const express = require('express')
const router = express.Router()

const {
  saveHotelInventory,
  generateHotelInventory,
  getHotelInventory,
  getHotelInventoryById,
  updateHotelInventory,
  deleteHotelInventory,
} = require('../controllers/hotelInventoryController')

// ================= MANUAL SAVE (CREATE / UPDATE) =================
router.post('/manual', saveHotelInventory)

// ================= GENERATE INVENTORY (from system / manual body) =================
router.post('/', generateHotelInventory)

// ================= GET ALL INVENTORY =================
// router.get('/', getHotelInventory)

// ================= GET SINGLE HOTEL INVENTORY =================
// router.get('/:hotelId', getHotelInventoryById)

// ================= UPDATE INVENTORY =================
router.put('/:hotelId', updateHotelInventory)

// ================= DELETE (SOFT DELETE) =================
router.delete('/:hotelId', deleteHotelInventory)

module.exports = router
