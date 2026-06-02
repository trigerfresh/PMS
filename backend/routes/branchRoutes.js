const express = require('express')
const router = express.Router()

const branchController = require('../controllers/branchController')
const authMiddleware = require('../middleware/authMiddleware')

// CREATE
router.post('/', authMiddleware, branchController.createBranch)

// GET ALL
router.get('/', authMiddleware, branchController.getBranches)

router.get('/branch', authMiddleware, branchController.getBranchesSearch)

router.get('/export', authMiddleware, branchController.exportBranches)

// GET SINGLE
router.get('/:id', authMiddleware, branchController.getBranchById)

// UPDATE
router.put('/:id', authMiddleware, branchController.updateBranch)

// DELETE
router.delete('/:id', authMiddleware, branchController.deleteBranch)

// router.get('/export', authMiddleware, branchController.exportBranches)

module.exports = router
