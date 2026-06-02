const express = require('express')

const router = express.Router()

const {
  createRole,
  getRoles,
  getRoleById,
  updateRole,
  deleteRole,
} = require('../controllers/roleMasterController')

const authMiddleware = require('../middleware/authMiddleware.js')

// ONLY LOGIN REQUIRED
// router.use(verifyToken)

router.post('/', authMiddleware, createRole)

router.get('/', authMiddleware, getRoles)

router.get('/:id', authMiddleware, getRoleById)

router.put('/:id', authMiddleware, updateRole)

router.delete('/:id', authMiddleware, deleteRole)

module.exports = router
