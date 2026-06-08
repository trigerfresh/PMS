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

    if (user.active === '1') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated/deleted',
      })
    }

    // TEMP password compare
    if (password !== user.password) {
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
