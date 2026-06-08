const express = require('express')
const router = express.Router()
const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

const upload = require('../utils/multer')
const controller = require('../controllers/productController')

// CREATE PRODUCT
router.post(
  '/product',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  controller.createProduct,
)

// GET
router.get('/product', controller.getProducts)

router.get('/product/search', async (req, res) => {
  try {
    const {
      product_name,
      primary_categories_name,
      category_name,
      subcategory_name,
      gst,
      price,
      hotel_id,
      branch_id,
    } = req.query

    let query = `
      SELECT
        p.*,
        pc.primary_categories_name,
        c.category_name,
        s.subcategory_name,
        h.hotel_name,
        b.branch_name
      FROM products p
      LEFT JOIN primary_categories pc
        ON p.pcat_id = pc.id
      LEFT JOIN categories c
        ON p.category_id = c.id
      LEFT JOIN subcategories s
        ON p.subcategory_id = s.id
      LEFT JOIN hotel h
        ON h.id = TRY_CAST(p.hotel_id AS INT)
      LEFT JOIN branch b
        ON b.id = TRY_CAST(p.branch_id AS INT)
      WHERE 1=1
    `

    if (hotel_id) {
      query += ` AND p.hotel_id = '${hotel_id}'`
    }

    if (branch_id) {
      query += ` AND p.branch_id = '${branch_id}'`
    }

    if (product_name) {
      query += ` AND p.product_name LIKE '%${product_name}%'`
    }

    if (primary_categories_name) {
      query += ` AND pc.primary_categories_name LIKE '%${primary_categories_name}%'`
    }

    if (category_name) {
      query += ` AND c.category_name LIKE '%${category_name}%'`
    }

    if (subcategory_name) {
      query += ` AND s.subcategory_name LIKE '%${subcategory_name}%'`
    }

    if (gst) {
      query += ` AND p.gst='${gst}'`
    }

    if (price) {
      query += ` AND p.price='${price}'`
    }

    const pool = await poolPromise

    const result = await pool.request().query(query)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

router.get('/product/excel', async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        p.id,
        p.product_name,
        p.gst,
        p.price,
        p.available_for_days,
        p.start_time,
        p.end_time,
        pc.primary_categories_name,
        c.category_name,
        s.subcategory_name
      FROM products p
      LEFT JOIN primary_categories pc
        ON p.pcat_id = pc.id
      LEFT JOIN categories c
        ON p.category_id = c.id
      LEFT JOIN subcategories s
        ON p.subcategory_id = s.id
      WHERE p.active='0'
      ORDER BY p.id DESC
    `)

    const data = result.recordset.map((item) => ({
      ID: item.id,
      PrimaryCategory: item.primary_categories_name,
      Category: item.category_name,
      SubCategory: item.subcategory_name,
      ProductName: item.product_name,
      GST: item.gst,
      Price: item.price,
      TotalPrice:
        Number(item.price) + (Number(item.price) * Number(item.gst)) / 100,
      AvailableDays: item.available_for_days,
      StartTime: item.start_time,
      EndTime: item.end_time,
    }))

    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Products')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx')

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    console.log(err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
})

// UPDATE
router.put(
  '/product/:id',
  upload.fields([
    { name: 'image1', maxCount: 1 },
    { name: 'image2', maxCount: 1 },
    { name: 'image3', maxCount: 1 },
    { name: 'image4', maxCount: 1 },
  ]),
  controller.updateProduct,
)

// DELETE
router.delete('/product/:id', controller.deleteProduct)

// RESTORE
router.put('/product/restore/:id', controller.restoreProduct)

module.exports = router
