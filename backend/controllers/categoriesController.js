const { poolPromise, sql } = require('../config/db')

exports.createCategory = async (req, res) => {
  try {
    const { category_name, pcat_id } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('name', sql.NVarChar, category_name)
      .input('pcat_id', sql.BigInt, pcat_id).query(`
        INSERT INTO categories (
          category_name,
          pcat_id,
          active,
          created_on
        )
        VALUES (@name, @pcat_id, '0', GETDATE())
      `)

    res.json({ success: true, message: 'Category created' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getCategories = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        c.id,
        c.category_name,
        c.pcat_id,
        p.primary_categories_name,
        c.active
      FROM categories c
      LEFT JOIN primary_categories p ON p.id = c.pcat_id
      ORDER BY c.id DESC
    `)

    res.json({ success: true, data: result.recordset })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// exports.getCategories = async (req, res) => {
//   try {
//     const pool = await poolPromise

//     const result = await pool.request().query(`
//       SELECT c.id, c.category_name, c.pcat_id, p.primary_categories_name, c.active
//       FROM categories c
//       LEFT JOIN primary_categories p ON p.id = c.pcat_id
//       WHERE c.active = '0'
//       ORDER BY c.id DESC
//     `)

//     res.json({ success: true, data: result.recordset })
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message })
//   }
// }

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category_name, pcat_id } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, category_name)
      .input('pcat_id', sql.BigInt, pcat_id).query(`
        UPDATE categories
        SET category_name = @name,
            pcat_id = @pcat_id,
            modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Category updated' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE categories
      SET active = '1',
          disabled_on = GETDATE()
      WHERE id = @id
    `)

    res.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restoreCategory = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
      UPDATE categories
      SET active = '0',
          modified_on = GETDATE()
      WHERE id = @id
    `)

    res.json({ success: true, message: 'Category restored' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
