const { poolPromise, sql } = require('../config/db')

exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, subcategory_name } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name).query(`
        INSERT INTO subcategories (
          category_id,
          subcategory_name,
          active,
          created_on
        )
        VALUES (@category_id, @name, '0', GETDATE())
      `)

    res.json({ success: true, message: 'Subcategory created' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
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
        c.category_name,
        p.id AS primary_id,
        p.primary_categories_name,
        s.active
      FROM subcategories s
      LEFT JOIN categories c ON c.id = s.category_id
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY s.id DESC
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

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('category_id', sql.BigInt, category_id)
      .input('name', sql.NVarChar, subcategory_name).query(`
        UPDATE subcategories
        SET subcategory_name = @name,
            category_id = @category_id,
            modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Updated' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
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
