const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const { poolPromise, sql } = require('../config/db')

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    const pool = await poolPromise

    const result = await pool.request().input('email', sql.VarChar, email)
      .query(`
        SELECT * FROM users
        WHERE email = @email
      `)

    const user = result.recordset[0]

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      })
    }

    if (String(user.active) === '1') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated/deleted',
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    let finalMatch = isMatch

    // Fallback for legacy plain-text passwords
    if (!isMatch && password === user.password) {
      finalMatch = true
      
      // Auto-migrate to hashed password
      const hashedPassword = await bcrypt.hash(password, 10)
      await pool.request()
        .input('id', sql.Int, user.id)
        .input('password', sql.VarChar, hashedPassword)
        .query('UPDATE users SET password = @password WHERE id = @id')
    }

    if (!finalMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password',
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d',
      },
    )

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.log(error)

    res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
