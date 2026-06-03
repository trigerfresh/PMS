const { poolPromise, sql } = require('../config/db')

exports.createPrimaryCategory = async (req, res) => {
  try {
    const { primary_categories_name } = req.body

    const pool = await poolPromise

    await pool.request().input('name', sql.NVarChar, primary_categories_name)
      .query(`
        INSERT INTO primary_categories (primary_categories_name, active, created_on)
        VALUES (@name, '0', GETDATE())
      `)

    res.json({ success: true, message: 'Category created' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getPrimaryCategories = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT id, primary_categories_name, active
      FROM primary_categories
      ORDER BY id DESC
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

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, primary_categories_name).query(`
        UPDATE primary_categories
        SET primary_categories_name = @name,
            modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Category updated' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
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
