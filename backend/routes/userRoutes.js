const express = require('express')
const router = express.Router()
const multer = require('multer')

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController')

// multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage })

// CREATE USER
router.post('/', upload.single('profile_image'), createUser)

// UPDATE USER
router.put('/:id', upload.single('profile_image'), updateUser)

router.get('/', getUsers)
router.get('/:id', getUserById)
router.delete('/:id', deleteUser)

module.exports = router
