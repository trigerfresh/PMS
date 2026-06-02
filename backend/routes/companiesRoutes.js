const express = require('express')
const multer = require('multer')
const router = express.Router()

const companyController = require('../controllers/companiesController.js')

const authMiddleware = require('../middleware/authMiddleware.js')

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },

  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  },
})

const upload = multer({ storage: storage })

// CREATE
router.post(
  '/',
  authMiddleware,
  upload.single('logo'),
  companyController.createCompany,
)
// READ ALL
router.get('/', authMiddleware, companyController.getCompanies)

router.get('/export', authMiddleware, companyController.exportCompanies)

// READ SINGLE
router.get('/:id', authMiddleware, companyController.getCompanyById)

// UPDATE
router.put(
  '/:id',
  authMiddleware,
  upload.single('logo'),
  companyController.updateCompany,
)

// DELETE
router.delete('/:id', authMiddleware, companyController.deleteCompany)

module.exports = router
