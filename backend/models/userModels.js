const bcrypt = require('bcryptjs')
const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

class UserModel {
  static async createUser(userData, profile_image) {
    const pool = await poolPromise
    
    let {
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
    } = userData

    if (fullname && (!first_name || !last_name)) {
      const parts = fullname.trim().split(/\s+/)
      first_name = parts[0] || ''
      last_name = parts.slice(1).join(' ') || ''
    } else if ((first_name || last_name) && !fullname) {
      fullname = `${first_name || ''} ${last_name || ''}`.trim()
    }

    const emailCheck = await pool
      .request()
      .input('email', sql.NVarChar, email)
      .query("SELECT id FROM users WHERE email = @email AND active = '0'")

    if (emailCheck.recordset.length > 0) {
      throw new Error('A user with this email address already exists')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await pool
      .request()
      .input('first_name', sql.NVarChar, first_name || null)
      .input('last_name', sql.NVarChar, last_name || null)
      .input('fullname', sql.NVarChar, fullname || null)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role || null)
      .input('phone', sql.NVarChar, phone || null)
      .input('address', sql.NVarChar, address || null)
      .input('city', sql.NVarChar, city || null)
      .input('pincode', sql.NVarChar, pincode || null)
      .input('company_id', sql.Int, company_id ? Number(company_id) : null)
      .input('branch_id', sql.Int, branch_id ? Number(branch_id) : null)
      .input('profile_image', sql.NVarChar, profile_image || null).query(`
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
  }

  static async getUsers() {
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
    return result.recordset
  }

  static async getUserById(id) {
    const pool = await poolPromise
    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT 
          u.*,
          b.branch_name,
          c.company_name
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        LEFT JOIN companies c ON u.company_id = c.id
        WHERE u.id = @id
      `)
    return result.recordset[0]
  }

  static async updateUser(id, userData, newProfileImage) {
    const pool = await poolPromise

    let {
      first_name,
      last_name,
      fullname,
      role,
      phone,
      address,
      city,
      pincode,
      company_id,
      branch_id,
      password,
    } = userData

    const oldUser = await pool
      .request()
      .input('id', sql.Int, id)
      .query(`SELECT * FROM users WHERE id=@id`)

    if (!oldUser.recordset.length) {
      throw new Error('User not found')
    }

    const existing = oldUser.recordset[0]
    const profile_image = newProfileImage || existing.profile_image

    if (fullname && (!first_name || !last_name)) {
      const parts = fullname.trim().split(/\s+/)
      first_name = parts[0] || ''
      last_name = parts.slice(1).join(' ') || ''
    } else if ((first_name || last_name) && !fullname) {
      fullname = `${first_name || ''} ${last_name || ''}`.trim()
    }

    let hashedPassword = existing.password
    if (password && password.trim() !== '') {
      hashedPassword = await bcrypt.hash(password, 10)
    }

    await pool
      .request()
      .input('id', sql.Int, id)
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
      .input('profile_image', sql.NVarChar, profile_image || null).query(`
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
  }

  static async deleteUser(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE users
        SET active='1'
        WHERE id=@id
      `)
  }

  static async getDeletedUsers() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT 
        u.*,
        b.branch_name,
        c.company_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.active = '1'
      ORDER BY u.id DESC
    `)
    return result.recordset
  }

  static async restoreUser(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE users
        SET active='0'
        WHERE id=@id
      `)
  }

  static async getUsersSearch(queryData) {
    const { fullname, email, role, branch, phone } = queryData
    const pool = await poolPromise
    let query = `
      SELECT u.*, b.branch_name, c.company_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.active = 0
    `
    const request = pool.request()

    if (fullname) {
      query += ` AND u.fullname LIKE '%' + @fullname + '%'`
      request.input('fullname', sql.NVarChar, fullname)
    }

    if (email) {
      query += ` AND u.email LIKE '%' + @email + '%'`
      request.input('email', sql.NVarChar, email)
    }

    if (role) {
      query += ` AND u.role LIKE '%' + @role + '%'`
      request.input('role', sql.NVarChar, role)
    }

    if (branch) {
      query += ` AND b.branch_name LIKE '%' + @branch + '%'`
      request.input('branch', sql.NVarChar, branch)
    }

    if (phone) {
      query += ` AND u.phone LIKE '%' + @phone + '%'`
      request.input('phone', sql.NVarChar, phone)
    }

    query += ` ORDER BY u.id DESC`
    const result = await request.query(query)
    return result.recordset
  }

  static async getProfile(id) {
    const pool = await poolPromise
    const result = await pool.request().input('id', sql.Int, id)
      .query(`
      SELECT
        u.*,
        c.company_name,
        b.branch_name
      FROM users u
      LEFT JOIN companies c ON c.id = u.company_id
      LEFT JOIN branch b ON b.id = u.branch_id
      WHERE u.id = @id
      AND u.active = '0'
    `)
    if (!result.recordset.length) {
      throw new Error('Profile not found')
    }
    return result.recordset[0]
  }

  static async updateProfile(id, profileData, newProfileImage) {
    const pool = await poolPromise
    const { fullname, phone, address, city, pincode } = profileData

    const oldUser = await pool
      .request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id=@id')

    if (!oldUser.recordset.length) {
      throw new Error('User not found')
    }

    const existing = oldUser.recordset[0]
    const profile_image = newProfileImage || existing.profile_image

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('fullname', sql.NVarChar, fullname)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('city', sql.NVarChar, city)
      .input('pincode', sql.NVarChar, pincode)
      .input('profile_image', sql.NVarChar, profile_image || null).query(`
        UPDATE users
        SET
          fullname=@fullname,
          phone=@phone,
          address=@address,
          city=@city,
          pincode=@pincode,
          profile_image=@profile_image
        WHERE id=@id
      `)
  }

  static async exportUsersExcel(queryData) {
    const { searchFields } = queryData
    const pool = await poolPromise
    const request = pool.request()

    let query = `
      SELECT u.*, b.branch_name, c.company_name
      FROM users u
      LEFT JOIN branch b ON u.branch_id = b.id
      LEFT JOIN companies c ON u.company_id = c.id
      WHERE u.active = 0
    `

    if (searchFields) {
      const fields = JSON.parse(searchFields)
      fields.forEach((item, index) => {
        if (item.keyword) {
          if (item.field === 'name') {
            query += ' AND u.fullname LIKE @kw' + index
            request.input('kw' + index, sql.NVarChar, '%' + item.keyword + '%')
          }
          if (item.field === 'email') {
            query += ' AND u.email LIKE @kw' + index
            request.input('kw' + index, sql.NVarChar, '%' + item.keyword + '%')
          }
          if (item.field === 'role') {
            query += ' AND u.role LIKE @kw' + index
            request.input('kw' + index, sql.NVarChar, '%' + item.keyword + '%')
          }
          if (item.field === 'branch_name') {
            query += ' AND b.branch_name LIKE @kw' + index
            request.input('kw' + index, sql.NVarChar, '%' + item.keyword + '%')
          }
          if (item.field === 'contactNo') {
            query += ' AND u.phone LIKE @kw' + index
            request.input('kw' + index, sql.NVarChar, '%' + item.keyword + '%')
          }
        }
      })
    }

    query += ' ORDER BY u.id DESC'

    const result = await request.query(query)

    const formattedData = result.recordset.map((item) => ({
      'ID': item.id,
      'Name': item.fullname || `${item.first_name || ''} ${item.last_name || ''}`.trim(),
      'Email': item.email,
      'Role': item.role,
      'Phone': item.phone,
      'Company': item.company_name || 'N/A',
      'Branch': item.branch_name || 'N/A',
      'Status': item.active === 0 ? 'Active' : 'Inactive',
      'Created On': item.created_on ? new Date(item.created_on).toLocaleDateString() : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(formattedData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Users')

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })
  }
}

module.exports = UserModel
