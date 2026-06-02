const { poolPromise, sql } = require('../config/db')

/* =========================
   CREATE ROLE
========================= */
exports.createRole = async (req, res) => {
  try {
    const { role } = req.body

    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
      })
    }

    const pool = await poolPromise

    const existingRole = await pool
      .request()
      .input('role', sql.VarChar, role)
      .query(`SELECT * FROM role_master WHERE role = @role`)

    if (existingRole.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists',
      })
    }

    await pool
      .request()
      .input('role', sql.VarChar, role)
      .input('created_by', sql.VarChar, String(req.user.id)).query(`
        INSERT INTO role_master (role, active, created_by, created_on)
        VALUES (@role, '1', @created_by, GETDATE())
      `)

    return res.json({
      success: true,
      message: 'Role created successfully',
    })
  } catch (err) {
    return res.status(500).json({ message: err.message })
  }
}

/* =========================
   GET ALL ROLES
========================= */
exports.getRoles = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM role_master
      WHERE active = '1'
      ORDER BY id DESC
    `)

    return res.json({
      success: true,
      data: result.recordset,
    })
  } catch (err) {
    console.log('GET ROLES ERROR:', err)

    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

/* =========================
   GET ROLE BY ID
========================= */
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT *
        FROM role_master
        WHERE id = @id
      `)

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      })
    }

    return res.json({
      success: true,
      data: result.recordset[0],
    })
  } catch (err) {
    console.log('GET ROLE BY ID ERROR:', err)

    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

/* =========================
   UPDATE ROLE
========================= */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params
    const { role } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('role', sql.VarChar, role)
      .input('modified_by', sql.VarChar, String(req.user.id)).query(`
        UPDATE role_master
        SET
          role = @role,
          modified_by = @modified_by,
          modified_on = GETDATE()
        WHERE id = @id
      `)

    return res.json({
      success: true,
      message: 'Role updated successfully',
    })
  } catch (err) {
    console.log('UPDATE ROLE ERROR:', err)

    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

/* =========================
   DELETE ROLE (SOFT DELETE)
========================= */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('disabled_by', sql.VarChar, String(req.user.id)).query(`
        UPDATE role_master
        SET
          active = '0',
          disabled_by = @disabled_by,
          disabled_on = GETDATE()
        WHERE id = @id
      `)

    return res.json({
      success: true,
      message: 'Role deleted successfully',
    })
  } catch (err) {
    console.log('DELETE ROLE ERROR:', err)

    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
