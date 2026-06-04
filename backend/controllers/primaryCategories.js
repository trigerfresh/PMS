const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

exports.createPrimaryCategory = async (req, res) => {
  try {
    const { primary_categories_name } = req.body

    const image = req.file ? req.file.filename : null

    const pool = await poolPromise

    await pool
      .request()
      .input('name', sql.NVarChar, primary_categories_name)
      .input('image', sql.NVarChar, image).query(`
        INSERT INTO primary_categories
        (
          primary_categories_name,
          image,
          active,
          created_on
        )
        VALUES
        (
          @name,
          @image,
          '0',
          GETDATE()
        )
      `)

    res.json({
      success: true,
      message: 'Category created',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getPrimaryCategories = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT id, primary_categories_name, image, active
      FROM primary_categories
      ORDER BY id ASC
    `)

    res.json({ success: true, data: result.recordset })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updatePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { primary_categories_name } = req.body

    const image = req.file ? req.file.filename : null

    const pool = await poolPromise

    let query = `
      UPDATE primary_categories
      SET primary_categories_name = @name,
          modified_on = GETDATE()
    `

    if (image) {
      query += `, image = @image`
    }

    query += ` WHERE id = @id`

    const request = pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, primary_categories_name)

    if (image) {
      request.input('image', sql.NVarChar, image)
    }

    await request.query(query)

    res.json({
      success: true,
      message: 'Category updated',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deletePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
        UPDATE primary_categories
        SET active = '1',
            disabled_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Category deleted (soft)' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restorePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
        UPDATE primary_categories
        SET active = '0',
            modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Category restored' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.searchPrimaryCategories = async (req, res) => {
  try {
    const { primary_categories_name } = req.query

    const pool = await poolPromise

    let query = `
      SELECT
        id,
        primary_categories_name,
        active
      FROM primary_categories
      WHERE 1=1
    `

    if (primary_categories_name) {
      query += `
        AND primary_categories_name LIKE '%${primary_categories_name}%'
      `
    }

    query += ` ORDER BY id DESC`

    const result = await pool.request().query(query)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.exportExcel = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT id, primary_categories_name, active, created_on
      FROM primary_categories
      ORDER BY id DESC
    `)

    const data = result.recordset

    // Convert JSON → Excel sheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PrimaryCategories')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=primary_categories.xlsx',
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
