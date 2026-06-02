const multer = require('multer')
const path = require('path')

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname
    cb(null, uniqueName)
  },
})

// file filter (optional but good)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4') {
    cb(null, true)
  } else {
    cb(new Error('Only images and mp4 videos allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
})

module.exports = upload
