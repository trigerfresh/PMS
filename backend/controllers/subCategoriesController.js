const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, subcategory_name } = req.body

    const image = req.file ? req.file.filename : null

    const pool = await poolPromise

    await pool
      .request()
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name)
      .input('image', sql.NVarChar, image).query(`
        INSERT INTO subcategories (
          category_id,
          subcategory_name,
          image,
          active,
          created_on
        )
        VALUES (
          @category_id,
          @name,
          @image,
          '0',
          GETDATE()
        )
      `)

    res.json({
      success: true,
      message: 'Subcategory created successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getSubcategories = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        s.id,
        s.subcategory_name,
        s.category_id,
        s.image,
        c.category_name,
        p.id AS primary_id,
        p.primary_categories_name,
        s.active
      FROM subcategories s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY s.id ASC
    `)

    res.json({ success: true, data: result.recordset })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category_id, subcategory_name } = req.body

    const image = req.file ? req.file.filename : null

    let query = `
      UPDATE subcategories
      SET subcategory_name = @name,
          category_id = @category_id,
          modified_on = GETDATE()
    `

    if (image) {
      query += `, image = @image`
    }

    query += ` WHERE id = @id`

    const pool = await poolPromise

    const request = pool
      .request()
      .input('id', sql.BigInt, id)
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name)

    if (image) {
      request.input('image', sql.NVarChar, image)
    }

    await request.query(query)

    res.json({
      success: true,
      message: 'Updated',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE subcategories
      SET active = '1',
          disabled_on = GETDATE()
      WHERE id = @id
    `)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restoreSubcategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE subcategories
      SET active = '0',
          modified_on = GETDATE()
      WHERE id = @id
    `)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.searchSubcategories = async (req, res) => {
  try {
    const { keyword } = req.query

    const pool = await poolPromise

    const result = await pool
      .request()
      .input('keyword', sql.NVarChar, `%${keyword}%`).query(`
        SELECT 
          s.id,
          s.subcategory_name,
          s.category_id,
          c.category_name,
          p.id AS primary_id,
          p.primary_categories_name,
          s.active
        FROM subcategories s
        LEFT JOIN categories c ON c.id = s.category_id
        LEFT JOIN primary_categories p ON p.id = c.pcat_id
        WHERE s.subcategory_name LIKE @keyword
           OR c.category_name LIKE @keyword
           OR p.primary_categories_name LIKE @keyword
        ORDER BY s.id DESC
      `)

    res.json({ success: true, data: result.recordset })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.downloadSubcategoriesXlsx = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        s.id,
        p.primary_categories_name,
        c.category_name,
        s.subcategory_name,
        s.active,
        s.created_on,
        s.modified_on
      FROM subcategories s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY s.id DESC
    `)

    const data = result.recordset

    // Convert JSON → worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcategories')

    // Generate buffer (important for backend download)
    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    // Response headers
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="subcategories.xlsx"',
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    // Send file
    res.send(buffer)
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
