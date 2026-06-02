const bcrypt = require('bcryptjs')
const { poolPromise, sql } = require('../config/db')

/* ==============================
   CREATE USER
============================== */
exports.createUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      fullname, // ✅ NOW SEPARATE FIELD
      email,
      password,
      role,
      phone,
      address,
      city,
      pincode,
      company_id,
      branch_id,
    } = req.body

    const profile_image = req.file ? req.file.filename : null

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const pool = await poolPromise

    await pool
      .request()
      .input('first_name', sql.NVarChar, first_name || null)
      .input('last_name', sql.NVarChar, last_name || null)
      .input('fullname', sql.NVarChar, fullname || null) // ✅ direct from frontend
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('pincode', sql.NVarChar, pincode || null)
      .input('company_id', sql.Int, company_id ? Number(company_id) : null)
      .input('branch_id', sql.Int, branch_id ? Number(branch_id) : null)
      .input('profile_image', sql.NVarChar, profile_image).query(`
        INSERT INTO users (
          first_name,
          last_name,
          fullname,
          email,
          password,
          role,
          phone,
          address,
          city,
          pincode,
          company_id,
          branch_id,
          profile_image,
          active,
          created_on
        )
        VALUES (
          @first_name,
          @last_name,
          @fullname,
          @email,
          @password,
          @role,
          @phone,
          @address,
          @city,
          @pincode,
          @company_id,
          @branch_id,
          @profile_image,
          '0',
          GETDATE()
        )
      `)

    return res.json({
      success: true,
      message: 'User created successfully',
    })
  } catch (err) {
    console.error('CREATE USER ERROR:', err)
    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
/* ==============================
   GET ALL USERS (WITH JOIN)
============================== */
exports.getUsers = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        u.*,
        b.branch_name,
        c.company_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.active = '0'
      ORDER BY u.id DESC
    `)

    res.json(result.recordset)
  } catch (err) {
    console.error('GET USERS ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

/* ==============================
   GET USER BY ID
============================== */
exports.getUserById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT 
          u.*,
          b.branch_name,
          c.company_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id = @id
      `)

    res.json(result.recordset[0])
  } catch (err) {
    console.error('GET USER ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

/* ==============================
   UPDATE USER
============================== */
exports.updateUser = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      role,
      phone,
      address,
      city,
      pincode,
      company_id,
      branch_id,
      password,
    } = req.body

    const pool = await poolPromise

    const oldUser = await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT * FROM users WHERE id=@id`)

    if (!oldUser.recordset.length) {
      return res.status(404).json({ message: 'User not found' })
    }

    const existing = oldUser.recordset[0]

    const profile_image = req.file ? req.file.filename : existing.profile_image

    const fullname = `${first_name || ''} ${last_name || ''}`.trim()

    let hashedPassword = existing.password
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('first_name', sql.NVarChar, first_name || null)
      .input('last_name', sql.NVarChar, last_name || null)
      .input('fullname', sql.NVarChar, fullname || null)
      .input('role', sql.NVarChar, role || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('pincode', sql.NVarChar, pincode || null)
      .input('company_id', sql.Int, company_id ? Number(company_id) : null)
      .input('branch_id', sql.Int, branch_id ? Number(branch_id) : null)
      .input('password', sql.NVarChar, hashedPassword)
      .input('profile_image', sql.NVarChar, profile_image).query(`
        UPDATE users
        SET
          first_name=@first_name,
          last_name=@last_name,
          fullname=@fullname,
          role=@role,
          phone=@phone,
          address=@address,
          city=@city,
          pincode=@pincode,
          company_id=@company_id,
          branch_id=@branch_id,
          password=@password,
          profile_image=@profile_image
        WHERE id=@id
      `)

    res.json({
      success: true,
      message: 'User updated successfully',
    })
  } catch (err) {
    console.error('UPDATE USER ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

/* ==============================
   DELETE USER (SOFT DELETE)
============================== */
exports.deleteUser = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool.request().input('id', sql.Int, req.params.id).query(`
        UPDATE users
        SET active='1'
        WHERE id=@id
      `)

    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (err) {
    console.error('DELETE USER ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}
