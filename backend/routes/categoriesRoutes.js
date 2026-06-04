const express = require('express')
const router = express.Router()
const upload = require('../utils/multer')
const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

const controller = require('../controllers/categoriesController')

router.post('/category', upload.single('image'), controller.createCategory)
router.post('/category/search', async (req, res) => {
  try {
    const { search = [], from, to } = req.body

    const pool = await poolPromise

    let query = `
  SELECT c.*, p.primary_categories_name
  FROM categories c
  LEFT JOIN primary_categories p ON p.id = c.pcat_id
  WHERE 1=1
`

    const request = pool.request()

    search.forEach((s, index) => {
      if (s.keyword) {
        if (s.field === 'category_name') {
          query += ` AND c.category_name LIKE @cat${index}`
          request.input(`cat${index}`, sql.VarChar, `%${s.keyword}%`)
        }

        if (s.field === 'primary_categories_name') {
          query += ` AND p.primary_categories_name LIKE @pcat${index}`
          request.input(`pcat${index}`, sql.VarChar, `%${s.keyword}%`)
        }
      }
    })

    if (from && to) {
      query += ` AND CAST(c.created_at AS DATE) BETWEEN @from AND @to`
      request.input('from', sql.Date, from)
      request.input('to', sql.Date, to)
    }

    const result = await request.query(query)

    res.json({ data: result.recordset })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Search error' })
  }
})

router.post('/category/export-excel', async (req, res) => {
  try {
    const { search = [], from, to } = req.body

    const pool = await poolPromise

    let query = `
      SELECT c.id,
             c.category_name,
             p.primary_categories_name,
             c.created_on
      FROM categories c
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      WHERE 1=1
    `

    const request = pool.request()

    search.forEach((s, index) => {
      if (s.keyword) {
        if (s.field === 'category_name') {
          query += ` AND c.category_name LIKE @cat${index}`
          request.input(`cat${index}`, sql.VarChar, `%${s.keyword}%`)
        }

        if (s.field === 'primary_categories_name') {
          query += ` AND p.primary_categories_name LIKE @pcat${index}`
          request.input(`pcat${index}`, sql.VarChar, `%${s.keyword}%`)
        }
      }
    })

    if (from && to) {
      query += ` AND CAST(c.created_on AS DATE) BETWEEN @from AND @to`
      request.input('from', sql.Date, from)
      request.input('to', sql.Date, to)
    }

    const result = await request.query(query)
    const rows = result.recordset

    // ================= XLSX WORKBOOK =================
    const worksheet = XLSX.utils.json_to_sheet(rows)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx')

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: 'Excel export error' })
  }
})

router.get('/primary-category-dropdown', controller.getPrimaryCategoryDropdown)

router.get('/category', controller.getCategories)
router.put('/category/:id', upload.single('image'), controller.updateCategory)
router.delete('/category/:id', controller.deleteCategory)
router.put('/category/restore/:id', controller.restoreCategory)

module.exports = router
