const XLSX = require('xlsx')

const { poolPromise, sql } = require('../config/db')

// ==========================================
// CREATE COMPANY
// ==========================================
exports.createCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      company_name,
      contact_person,
      email_id,
      address,
      country_name,
      state_name,
      city_name,
      pincode,
      state_code,
      contact_no,
      currency_name,
      gst_no,
      website,
      vat_in,
      cin_no,
      cst,

      // BANK DETAILS
      bank_name,
      account_no,
      account_type,
      branch_city,
      bank_address,
      swift_no,
      micr_no,
      ifsc_code,

      terms_conditions,
    } = req.body

    console.log(req.body)
    console.log(req.file)

    const result = await pool
      .request()

      // COMPANY DETAILS
      .input('company_name', sql.VarChar(sql.MAX), company_name)
      .input('contact_person', sql.VarChar(sql.MAX), contact_person)
      .input('email_id', sql.VarChar(sql.MAX), email_id)
      .input('address', sql.VarChar(sql.MAX), address)
      .input('country_name', sql.VarChar(sql.MAX), country_name)
      .input('state_name', sql.VarChar(sql.MAX), state_name)
      .input('city_name', sql.VarChar(sql.MAX), city_name)
      .input('pincode', sql.VarChar(sql.MAX), pincode)
      .input('state_code', sql.VarChar(sql.MAX), state_code)
      .input('contact_no', sql.VarChar(sql.MAX), contact_no)
      .input('currency_name', sql.VarChar(sql.MAX), currency_name)
      .input('gst_no', sql.VarChar(sql.MAX), gst_no)
      .input('website', sql.VarChar(sql.MAX), website)
      .input('vat_in', sql.VarChar(sql.MAX), vat_in)
      .input('cin_no', sql.VarChar(sql.MAX), cin_no)
      .input('cst', sql.VarChar(sql.MAX), cst)

      // BANK DETAILS
      .input('bank_name', sql.VarChar(sql.MAX), bank_name)
      .input('account_no', sql.VarChar(sql.MAX), account_no)
      .input('account_type', sql.VarChar(sql.MAX), account_type)
      .input('branch_city', sql.VarChar(sql.MAX), branch_city)
      .input('bank_address', sql.VarChar(sql.MAX), bank_address)
      .input('swift_no', sql.VarChar(sql.MAX), swift_no)
      .input('micr_no', sql.VarChar(sql.MAX), micr_no)
      .input('ifsc_code', sql.VarChar(sql.MAX), ifsc_code)

      // OTHER DETAILS
      .input('terms_conditions', sql.VarChar(sql.MAX), terms_conditions)
      .input('active', sql.VarChar(sql.MAX), '0')
      .input('created_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('created_on', sql.DateTime, new Date()).query(`
        INSERT INTO companies (
          company_name,
          contact_person,
          email_id,
          address,
          country_name,
          state_name,
          city_name,
          pincode,
          state_code,
          contact_no,
          currency_name,
          gst_no,
          website,
          vat_in,
          cin_no,
          cst,

          bank_name,
          account_no,
          account_type,
          branch_city,
          bank_address,
          swift_no,
          micr_no,
          ifsc_code,

          terms_conditions,
          active,
          created_by,
          created_on
        )

        OUTPUT INSERTED.id

        VALUES (
          @company_name,
          @contact_person,
          @email_id,
          @address,
          @country_name,
          @state_name,
          @city_name,
          @pincode,
          @state_code,
          @contact_no,
          @currency_name,
          @gst_no,
          @website,
          @vat_in,
          @cin_no,
          @cst,

          @bank_name,
          @account_no,
          @account_type,
          @branch_city,
          @bank_address,
          @swift_no,
          @micr_no,
          @ifsc_code,

          @terms_conditions,
          @active,
          @created_by,
          @created_on
        )
      `)

    // INSERTED COMPANY ID
    const companyId = result.recordset[0].id

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      company: {
        id: companyId,
      },
    })
  } catch (error) {
    console.log('CREATE COMPANY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: 'Create Failed',
      error: error.message,
    })
  }
}

// ==========================================
// GET ALL COMPANIES
// ==========================================

exports.getCompanies = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = "WHERE active = '0'"
    const request = pool.request()

    // Dynamic Search
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const conditions = []

      fields.forEach((item, index) => {
        const paramName = `search${index}`

        switch (item.field) {
          case 'companyName':
            conditions.push(`company_name LIKE @${paramName}`)
            break

          case 'contactPersonName':
            conditions.push(`contact_person LIKE @${paramName}`)
            break

          case 'emailId':
            conditions.push(`email_id LIKE @${paramName}`)
            break

          case 'contactNo':
            conditions.push(`contact_no LIKE @${paramName}`)
            break

          case 'city':
            conditions.push(`city_name LIKE @${paramName}`)
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

    // Date Filter
    if (fromDate && toDate) {
      whereClause += ` AND CAST(created_on AS DATE) BETWEEN @fromDate AND @toDate`

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const query = `
      SELECT *
      FROM companies
      ${whereClause}
      ORDER BY id DESC
    `

    const result = await request.query(query)

    return res.status(200).json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
// exports.getCompanies = async (req, res) =
//   try {
//     const pool = await poolPromise

//     const result = await pool.request().query(`
//       SELECT *
//       FROM companies
//       WHERE active = '0'
//       ORDER BY id DESC
//     `)

//     return res.status(200).json({
//       success: true,
//       data: result.recordset,
//     })
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       error: error.message,
//     })
//   }
// }

// ==========================================
// GET SINGLE COMPANY
// ==========================================
exports.getCompanyById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT *
        FROM companies
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
// UPDATE COMPANY
// ==========================================
exports.updateCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      company_name,
      contact_person,
      email_id,
      address,
      country_name,
      state_name,
      city_name,
      pincode,
      state_code,
      contact_no,
      currency_name,
      gst_no,
      website,
      vat_in,
      cin_no,
      cst,
      bank_name,
      account_no,
      account_type,
      branch_city,
      bank_address,
      swift_no,
      micr_no,
      ifsc_code,
      terms_conditions,
    } = req.body

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('company_name', sql.VarChar(sql.MAX), company_name)
      .input('contact_person', sql.VarChar(sql.MAX), contact_person)
      .input('email_id', sql.VarChar(sql.MAX), email_id)
      .input('address', sql.VarChar(sql.MAX), address)
      .input('country_name', sql.VarChar(sql.MAX), country_name)
      .input('state_name', sql.VarChar(sql.MAX), state_name)
      .input('city_name', sql.VarChar(sql.MAX), city_name)
      .input('pincode', sql.VarChar(sql.MAX), pincode)
      .input('state_code', sql.VarChar(sql.MAX), state_code)
      .input('contact_no', sql.VarChar(sql.MAX), contact_no)
      .input('currency_name', sql.VarChar(sql.MAX), currency_name)
      .input('gst_no', sql.VarChar(sql.MAX), gst_no)
      .input('website', sql.VarChar(sql.MAX), website)
      .input('vat_in', sql.VarChar(sql.MAX), vat_in)
      .input('cin_no', sql.VarChar(sql.MAX), cin_no)
      .input('cst', sql.VarChar(sql.MAX), cst)
      .input('bank_name', sql.VarChar(sql.MAX), bank_name)
      .input('account_no', sql.VarChar(sql.MAX), account_no)
      .input('account_type', sql.VarChar(sql.MAX), account_type)
      .input('branch_city', sql.VarChar(sql.MAX), branch_city)
      .input('bank_address', sql.VarChar(sql.MAX), bank_address)
      .input('swift_no', sql.VarChar(sql.MAX), swift_no)
      .input('micr_no', sql.VarChar(sql.MAX), micr_no)
      .input('ifsc_code', sql.VarChar(sql.MAX), ifsc_code)
      .input('terms_conditions', sql.VarChar(sql.MAX), terms_conditions)
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('modified_on', sql.DateTime, new Date()).query(`
        UPDATE companies
        SET
          company_name = @company_name,
          contact_person = @contact_person,
          email_id = @email_id,
          address = @address,
          country_name = @country_name,
          state_name = @state_name,
          city_name = @city_name,
          pincode = @pincode,
          state_code = @state_code,
          contact_no = @contact_no,
          currency_name = @currency_name,
          gst_no = @gst_no,
          website = @website,
          vat_in = @vat_in,
          cin_no = @cin_no,
          cst = @cst,
          bank_name = @bank_name,
          account_no = @account_no,
          account_type = @account_type,
          branch_city = @branch_city,
          bank_address = @bank_address,
          swift_no = @swift_no,
          micr_no = @micr_no,
          ifsc_code = @ifsc_code,
          terms_conditions = @terms_conditions,
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

// ==========================================
// DELETE COMPANY (SOFT DELETE)
// ==========================================
exports.deleteCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, req.params.id)
      .input('deleted_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('deleted_on', sql.DateTime, new Date()).query(`
        UPDATE companies
        SET
          active = '1',
          deleted_by = @deleted_by,
          deleted_on = @deleted_on
        WHERE id = @id
      `)

    return res.status(200).json({
      success: true,
      message: 'Company deleted successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.exportCompanies = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = "WHERE active = '0'"
    const request = pool.request()

    // Search Filters
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const conditions = []

      fields.forEach((item, index) => {
        const paramName = `search${index}`

        switch (item.field) {
          case 'companyName':
            conditions.push(`company_name LIKE @${paramName}`)
            break

          case 'contactPersonName':
            conditions.push(`contact_person LIKE @${paramName}`)
            break

          case 'emailId':
            conditions.push(`email_id LIKE @${paramName}`)
            break

          case 'contactNo':
            conditions.push(`contact_no LIKE @${paramName}`)
            break

          case 'city':
            conditions.push(`city_name LIKE @${paramName}`)
            break
        }

        request.input(paramName, sql.VarChar, `%${item.keyword}%`)
      })

      if (conditions.length > 0) {
        whereClause += ` AND (${conditions.join(' OR ')})`
      }
    }

    // Date Filter
    if (fromDate && toDate) {
      whereClause += ` AND CAST(created_on AS DATE) BETWEEN @fromDate AND @toDate`

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const result = await request.query(`
      SELECT
        company_name AS 'Company Name',
        contact_person AS 'Contact Person',
        email_id AS 'Email',
        contact_no AS 'Contact Number',
        city_name AS 'City',
        gst_no AS 'GST Number',
        website AS 'Website',
        created_on AS 'Created On'
      FROM companies
      ${whereClause}
      ORDER BY id DESC
    `)

    const worksheet = XLSX.utils.json_to_sheet(result.recordset)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader('Content-Disposition', 'attachment; filename=Companies.xlsx')

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    return res.send(buffer)
  } catch (error) {
    console.log('Export Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message,
    })
  }
}
