const express = require('express')
const router = express.Router()
const multer = require('multer')
const authMiddleware = require('../middleware/authMiddleware')

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDeletedUsers,
  restoreUser,
  getUsersSearch,
  getProfile,
  updateProfile,
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
router.post('/search', getUsersSearch)
router.get('/profile/:id', authMiddleware, getProfile)
router.put('/restore/:id', restoreUser)
router.get('/deleted', getDeletedUsers)
// UPDATE USER
router.put(
  '/profile',
  authMiddleware,
  upload.single('profile_image'),
  updateProfile,
)
router.put('/:id', upload.single('profile_image'), updateUser)

router.get('/', getUsers)
router.get('/:id', getUserById)
router.delete('/:id', deleteUser)

module.exports = router
