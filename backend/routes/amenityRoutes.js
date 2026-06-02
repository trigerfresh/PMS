const express = require('express')

const router = express.Router()

const authMiddleware = require('../middleware/authMiddleware')

const {
  createAmenity,
  getAmenities,
  getAmenityById,
  updateAmenity,
  deleteAmenity,
} = require('../controllers/amenityController')

// CREATE
router.post('/', authMiddleware, createAmenity)

// GET ALL
router.get('/', authMiddleware, getAmenities)

// GET SINGLE
router.get('/:id', authMiddleware, getAmenityById)

// UPDATE
router.put('/:id', authMiddleware, updateAmenity)

// DELETE
router.delete('/:id', authMiddleware, deleteAmenity)

module.exports = router
