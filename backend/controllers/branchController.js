const { poolPromise, sql } = require('../config/db')
const xlsx = require('xlsx')
// ==========================================
// CREATE BRANCH
// ==========================================
exports.createBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      branch_name,
      branch_code,
      company_name,
      email,
      address,
      city,
      pincode,
      costing_method,
      def_purchase_ac,
      def_sales_ac,
      def_branch_recv_ac,
      def_branch_desp_ac,
      branch_id,
      company_id,
      phone,
    } = req.body

    await pool
      .request()
      .input('branch_name', sql.VarChar(sql.MAX), branch_name)
      .input('branch_code', sql.VarChar(sql.MAX), branch_code)
      .input('company_name', sql.VarChar(sql.MAX), company_name)
      .input('email', sql.VarChar(sql.MAX), email)
      .input('address', sql.VarChar(sql.MAX), address)
      .input('city', sql.VarChar(sql.MAX), city)
      .input('pincode', sql.VarChar(11), pincode)
      .input('costing_method', sql.VarChar(sql.MAX), costing_method)
      .input('def_purchase_ac', sql.VarChar(sql.MAX), def_purchase_ac)
      .input('def_sales_ac', sql.VarChar(sql.MAX), def_sales_ac)
      .input('def_branch_recv_ac', sql.VarChar(sql.MAX), def_branch_recv_ac)
      .input('def_branch_desp_ac', sql.VarChar(sql.MAX), def_branch_desp_ac)
      .input('branch_id', sql.VarChar(10), branch_id)
      .input('company_id', sql.VarChar(10), company_id)
      .input('phone', sql.VarChar(sql.MAX), phone)
      .input('active', sql.VarChar(1), '0')
      .input('created_by', sql.Int, req.user.id)
      .input('created_on', sql.DateTime2, new Date()).query(`
        INSERT INTO branch (
          branch_name,
          branch_code,
          company_name,
          email,
          address,
          city,
          pincode,
          costing_method,
          def_purchase_ac,
          def_sales_ac,
          def_branch_recv_ac,
          def_branch_desp_ac,
          active,
          created_by,
          created_on,
          branch_id,
          company_id,
          phone
        )
        VALUES (
          @branch_name,
          @branch_code,
          @company_name,
          @email,
          @address,
          @city,
          @pincode,
          @costing_method,
          @def_purchase_ac,
          @def_sales_ac,
          @def_branch_recv_ac,
          @def_branch_desp_ac,
          @active,
          @created_by,
          @created_on,
          @branch_id,
          @company_id,
          @phone
        )
      `)

    return res.status(201).json({
      success: true,
      message: 'Branch created successfully',
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.getBranchesSearch = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    let sql = `SELECT * FROM branches WHERE 1=1`
    const values = []

    // -------------------------
    // MULTI SEARCH LOGIC
    // -------------------------
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const searchConditions = []

      fields.forEach((item) => {
        const keyword = item.keyword?.trim()
        const field = item.field

        if (keyword) {
          if (field === 'branchName') {
            searchConditions.push(`branch_name LIKE ?`)
            values.push(`%${keyword}%`)
          }

          if (field === 'address') {
            searchConditions.push(`address LIKE ?`)
            values.push(`%${keyword}%`)
          }

          if (field === 'pincode') {
            searchConditions.push(`pincode LIKE ?`)
            values.push(`%${keyword}%`)
          }
        }
      })

      if (searchConditions.length > 0) {
        sql += ` AND (${searchConditions.join(' OR ')})`
      }
    }

    // -------------------------
    // DATE FILTER (optional)
    // -------------------------
    if (fromDate && toDate) {
      sql += ` AND DATE(created_at) BETWEEN ? AND ?`
      values.push(fromDate, toDate)
    }

    sql += ` ORDER BY id DESC`

    // -------------------------
    // DB EXECUTION
    // -------------------------
    const [rows] = await db.query(sql, values)

    return res.json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.error('Branch Search Error:', error)
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
    })
  }
}

// ==========================================
// GET ALL BRANCHES
// ==========================================
exports.getBranches = async (req, res) => {
  try {
    const pool = await poolPromise

    const { status } = req.query

    let where = ''

    if (status === 'active') {
      where = "WHERE active = '0'"
    } else if (status === 'deleted') {
      where = "WHERE active = '1'"
    } else {
      where = '' // all
    }

    const result = await pool.request().query(`
      SELECT *
      FROM branch
      ${where}
      ORDER BY id ASC
    `)

    return res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// ==========================================
// GET SINGLE BRANCH
// ==========================================
exports.getBranchById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT *
        FROM branch
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      data: result.recordset[0],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// ==========================================
// UPDATE BRANCH
// ==========================================
exports.updateBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      branch_name,
      branch_code,
      company_name,
      email,
      address,
      city,
      pincode,
      costing_method,
      def_purchase_ac,
      def_sales_ac,
      def_branch_recv_ac,
      def_branch_desp_ac,
      branch_id,
      company_id,
      phone,
    } = req.body

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('branch_name', sql.VarChar(sql.MAX), branch_name)
      .input('branch_code', sql.VarChar(sql.MAX), branch_code)
      .input('company_name', sql.VarChar(sql.MAX), company_name)
      .input('email', sql.VarChar(sql.MAX), email)
      .input('address', sql.VarChar(sql.MAX), address)
      .input('city', sql.VarChar(sql.MAX), city)
      .input('pincode', sql.VarChar(11), pincode)
      .input('costing_method', sql.VarChar(sql.MAX), costing_method)
      .input('def_purchase_ac', sql.VarChar(sql.MAX), def_purchase_ac)
      .input('def_sales_ac', sql.VarChar(sql.MAX), def_sales_ac)
      .input('def_branch_recv_ac', sql.VarChar(sql.MAX), def_branch_recv_ac)
      .input('def_branch_desp_ac', sql.VarChar(sql.MAX), def_branch_desp_ac)
      .input('branch_id', sql.VarChar(10), branch_id)
      .input('company_id', sql.VarChar(10), company_id)
      .input('phone', sql.VarChar(sql.MAX), phone)
      .input('modified_by', sql.Int, req.user.id)
      .input('modified_on', sql.DateTime2, new Date()).query(`
        UPDATE branch
        SET
          branch_name = @branch_name,
          branch_code = @branch_code,
          company_name = @company_name,
          email = @email,
          address = @address,
          city = @city,
          pincode = @pincode,
          costing_method = @costing_method,
          def_purchase_ac = @def_purchase_ac,
          def_sales_ac = @def_sales_ac,
          def_branch_recv_ac = @def_branch_recv_ac,
          def_branch_desp_ac = @def_branch_desp_ac,
          branch_id = @branch_id,
          company_id = @company_id,
          phone = @phone,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Branch updated successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// ==========================================
// DELETE BRANCH
// ==========================================
exports.deleteBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('disabled_by', sql.Int, req.user.id)
      .input('disabled_on', sql.DateTime2, new Date()).query(`
        UPDATE branch
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Branch deleted successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.exportBranches = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query

    let filters = []
    let values = []

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((f) => {
        if (f.field && f.keyword) {
          filters.push(`${f.field} LIKE ?`)
          values.push(`%${f.keyword}%`)
        }
      })
    }

    if (fromDate && toDate) {
      filters.push(`DATE(created_at) BETWEEN ? AND ?`)
      values.push(fromDate, toDate)
    }

    let query = `
      SELECT 
        branch_name,
        address,
        pincode,
        company_name,
        email,
        phone,
        city
      FROM branch
    `

    if (filters.length > 0) {
      query += ' WHERE ' + filters.join(' AND ')
    }

    const pool = await poolPromise
    const [rows] = await pool.query(query, values)

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'No data to export' })
    }

    const worksheet = xlsx.utils.json_to_sheet(rows)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Branches')

    const buffer = xlsx.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', 'attachment; filename=branches.xlsx')

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    console.error('EXPORT ERROR:', err)
    res.status(500).json({
      message: 'Excel export failed',
      error: err.message,
    })
  }
}

exports.restoreBranch = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('modified_by', sql.Int, req.user.id)
      .input('modified_on', sql.DateTime2, new Date()).query(`
        UPDATE branch
        SET
          active = '0',
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Branch restored successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.getDeletedBranches = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = "WHERE active = '1'"
    const request = pool.request()

    // -------------------------
    // SEARCH FILTER
    // -------------------------
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const conditions = []

      fields.forEach((item, index) => {
        const paramName = `search${index}`

        switch (item.field) {
          case 'branchName':
            conditions.push(`branch_name LIKE @${paramName}`)
            break

          case 'branchCode':
            conditions.push(`branch_code LIKE @${paramName}`)
            break

          case 'city':
            conditions.push(`city LIKE @${paramName}`)
            break

          case 'email':
            conditions.push(`email LIKE @${paramName}`)
            break

          case 'phone':
            conditions.push(`phone LIKE @${paramName}`)
            break

          default:
            break
        }

        request.input(paramName, sql.VarChar, `%${item.keyword}%`)
      })

      if (conditions.length > 0) {
        whereClause += ` AND (${conditions.join(' OR ')})`
      }
    }

    // -------------------------
    // DATE FILTER (optional)
    // -------------------------
    if (fromDate && toDate) {
      whereClause += ` AND CAST(disabled_on AS DATE) BETWEEN @fromDate AND @toDate`

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    // -------------------------
    // QUERY
    // -------------------------
    const result = await request.query(`
      SELECT *
      FROM branch
      ${whereClause}
      ORDER BY id DESC
    `)

    return res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log('GET DELETED BRANCH ERROR:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
