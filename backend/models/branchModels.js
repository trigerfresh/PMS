const { poolPromise, sql } = require('../config/db')

// Note: If you have a separate db connection for the mysql query, it would need to be imported.
// Assuming db is a global or missing in the original file for getBranchesSearch.
// const db = require('../config/mysql_db'); // if this was missing

class BranchModel {
  static async createBranch(branchData, userId) {
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
    } = branchData

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
      .input('branch_id', sql.VarChar(10), branch_id || null)
      .input('company_id', sql.VarChar(10), company_id || null)
      .input('phone', sql.VarChar(sql.MAX), phone || null)
      .input('active', sql.VarChar(1), '0')
      .input('created_by', sql.Int, userId)
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
  }

  static async getBranchesSearch(searchFields, fromDate, toDate) {
    let sqlQuery = `SELECT * FROM branches WHERE 1=1`
    const values = []

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
        sqlQuery += ` AND (${searchConditions.join(' OR ')})`
      }
    }

    if (fromDate && toDate) {
      sqlQuery += ` AND DATE(created_at) BETWEEN ? AND ?`
      values.push(fromDate, toDate)
    }

    sqlQuery += ` ORDER BY id DESC`

    // Note: The original code used 'db' which was not defined in the original file. 
    // It will throw an error if this function is actually used, just as it did in the controller.
    const [rows] = await db.query(sqlQuery, values)
    return rows
  }

  static async getBranches(status, searchFields, fromDate, toDate, company_id) {
    const pool = await poolPromise

    let query = `
      SELECT *
      FROM branch
      WHERE 1=1
    `
    const request = pool.request()

    if (company_id) {
      query += ` AND company_id = @company_id`
      request.input('company_id', sql.Int, Number(company_id))
    }

    if (status === 'active' || status === 'approved') {
      query += ` AND active = '0'`
    } else if (status === 'deleted') {
      query += ` AND active = '1'`
    }

    if (searchFields) {
      const parsedFields = JSON.parse(searchFields)
      const conditions = []

      parsedFields.forEach((item, index) => {
        const keyword = item.keyword?.trim()
        const field = item.field
        const paramName = `keyword${index}`

        if (keyword) {
          if (field === 'branchName') {
            conditions.push(`branch_name LIKE @${paramName}`)
            request.input(paramName, sql.VarChar, `%${keyword}%`)
          } else if (field === 'address') {
            conditions.push(`address LIKE @${paramName}`)
            request.input(paramName, sql.VarChar, `%${keyword}%`)
          } else if (field === 'pincode') {
            conditions.push(`pincode LIKE @${paramName}`)
            request.input(paramName, sql.VarChar, `%${keyword}%`)
          }
        }
      })

      if (conditions.length > 0) {
        query += ` AND (${conditions.join(' OR ')})`
      }
    }

    if (fromDate && toDate) {
      query += ` AND CAST(created_on AS DATE) BETWEEN @fromDate AND @toDate`
      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)
    return result.recordset
  }

  static async getBranchById(id) {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT *
        FROM branch
        WHERE id = @id
      `)
    return result.recordset[0]
  }

  static async updateBranch(id, branchData, userId) {
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
    } = branchData

    await pool
      .request()
      .input('id', sql.Int, id)
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
      .input('branch_id', sql.VarChar(10), branch_id || null)
      .input('company_id', sql.VarChar(10), company_id || null)
      .input('phone', sql.VarChar(sql.MAX), phone || null)
      .input('modified_by', sql.Int, userId)
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
  }

  static async deleteBranch(id, userId) {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('disabled_by', sql.Int, userId)
      .input('disabled_on', sql.DateTime2, new Date()).query(`
        UPDATE branch
        SET
          active = '1',
          disabled_by = @disabled_by,
          disabled_on = @disabled_on
        WHERE id = @id
      `)
  }

  static async exportBranches(searchFields, fromDate, toDate) {
    let filters = []

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      fields.forEach((f) => {
        if (f.field && f.keyword) {
          filters.push(`${f.field} LIKE '%${f.keyword}%'`)
        }
      })
    }

    if (fromDate && toDate) {
      filters.push(
        `CAST(created_on AS DATE) BETWEEN '${fromDate}' AND '${toDate}'`,
      )
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
    const result = await pool.request().query(query)
    return result.recordset
  }

  static async restoreBranch(id, userId) {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('modified_by', sql.Int, userId)
      .input('modified_on', sql.DateTime2, new Date()).query(`
        UPDATE branch
        SET
          active = '0',
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)
  }

  static async getDeletedBranches(searchFields, fromDate, toDate) {
    const pool = await poolPromise
    let whereClause = "WHERE active = '1'"
    const request = pool.request()

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

    if (fromDate && toDate) {
      whereClause += ` AND CAST(disabled_on AS DATE) BETWEEN @fromDate AND @toDate`

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const result = await request.query(`
      SELECT *
      FROM branch
      ${whereClause}
      ORDER BY id DESC
    `)

    return result.recordset
  }
}

module.exports = BranchModel
