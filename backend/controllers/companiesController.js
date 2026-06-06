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
      terms_conditions,
    } = req.body

    const image = req.file ? req.file.filename : null

    const result = await pool
      .request()
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
      .input('terms_conditions', sql.VarChar(sql.MAX), terms_conditions)
      .input('image', sql.VarChar(255), image)
      .input('active', sql.VarChar(1), '0')
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
          terms_conditions,
          image,
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
          @terms_conditions,
          @image,
          @active,
          @created_by,
          @created_on
        )
      `)

    const companyId = result.recordset[0].id

    const banks = req.body.banks ? JSON.parse(req.body.banks) : []

    for (const bank of banks) {
      await pool
        .request()
        .input('company_id', sql.Int, companyId)
        .input('bank_name', sql.VarChar(sql.MAX), bank.bank_name)
        .input('account_no', sql.VarChar(sql.MAX), bank.account_no)
        .input('account_type', sql.VarChar(sql.MAX), bank.account_type)
        .input('branch_city', sql.VarChar(sql.MAX), bank.branch_city)
        .input('bank_address', sql.VarChar(sql.MAX), bank.bank_address)
        .input('swift_no', sql.VarChar(sql.MAX), bank.swift_no)
        .input('micr_no', sql.VarChar(sql.MAX), bank.micr_no)
        .input('ifsc_code', sql.VarChar(sql.MAX), bank.ifsc_code)
        .input('active', sql.VarChar(1), '0').query(`
          INSERT INTO company_banks (
            company_id,
            bank_name,
            account_no,
            account_type,
            branch_city,
            bank_address,
            swift_no,
            micr_no,
            ifsc_code,
            active
          )
          VALUES (
            @company_id,
            @bank_name,
            @account_no,
            @account_type,
            @branch_city,
            @bank_address,
            @swift_no,
            @micr_no,
            @ifsc_code,
            @active
          )
        `)
    }

    return res.status(201).json({
      success: true,
      message: 'Company created successfully',
      companyId,
    })
  } catch (error) {
    console.log('CREATE COMPANY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
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

    if (fromDate && toDate) {
      whereClause += ` 
        AND CAST(created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const result = await request.query(`
      SELECT *
      FROM companies
      ${whereClause}
      ORDER BY id DESC
    `)

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

    const companyResult = await pool
      .request()
      .input('id', sql.Int, req.params.id).query(`
        SELECT *
        FROM companies
        WHERE id = @id
      `)

    if (!companyResult.recordset.length) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      })
    }

    const banksResult = await pool
      .request()
      .input('company_id', sql.Int, req.params.id).query(`
        SELECT *
        FROM company_banks
        WHERE company_id = @company_id
        AND active = '0'
        ORDER BY id ASC
      `)

    return res.status(200).json({
      success: true,
      data: {
        ...companyResult.recordset[0],
        banks: banksResult.recordset,
      },
    })
  } catch (error) {
    console.log(error)

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

    const companyId = req.params.id

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
      terms_conditions,
    } = req.body

    const image = req.file ? req.file.filename : null

    // 1. UPDATE COMPANY
    await pool
      .request()
      .input('id', sql.Int, companyId)
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
      .input('terms_conditions', sql.VarChar(sql.MAX), terms_conditions)
      .input('image', sql.VarChar(255), image)
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('modified_on', sql.DateTime, new Date()).query(`
        UPDATE companies
        SET
          company_name=@company_name,
          contact_person=@contact_person,
          email_id=@email_id,
          address=@address,
          country_name=@country_name,
          state_name=@state_name,
          city_name=@city_name,
          pincode=@pincode,
          state_code=@state_code,
          contact_no=@contact_no,
          currency_name=@currency_name,
          gst_no=@gst_no,
          website=@website,
          vat_in=@vat_in,
          cin_no=@cin_no,
          cst=@cst,
          terms_conditions=@terms_conditions,
          image = ISNULL(@image,image),
          modified_by=@modified_by,
          modified_on=@modified_on
        WHERE id=@id
      `)

    // 2. MARK OLD BANKS INACTIVE (IMPORTANT FIX)
    await pool.request().input('company_id', sql.Int, companyId).query(`
        UPDATE company_banks
        SET active='1'
        WHERE company_id=@company_id
      `)

    // 3. INSERT NEW BANKS
    const banks = req.body.banks ? JSON.parse(req.body.banks) : []

    for (const bank of banks) {
      await pool
        .request()
        .input('company_id', sql.Int, companyId)
        .input('bank_name', sql.VarChar(sql.MAX), bank.bank_name)
        .input('account_no', sql.VarChar(sql.MAX), bank.account_no)
        .input('account_type', sql.VarChar(sql.MAX), bank.account_type)
        .input('branch_city', sql.VarChar(sql.MAX), bank.branch_city)
        .input('bank_address', sql.VarChar(sql.MAX), bank.bank_address)
        .input('swift_no', sql.VarChar(sql.MAX), bank.swift_no)
        .input('micr_no', sql.VarChar(sql.MAX), bank.micr_no)
        .input('ifsc_code', sql.VarChar(sql.MAX), bank.ifsc_code)
        .input('active', sql.VarChar(1), '0').query(`
          INSERT INTO company_banks (
            company_id,
            bank_name,
            account_no,
            account_type,
            branch_city,
            bank_address,
            swift_no,
            micr_no,
            ifsc_code,
            active
          )
          VALUES (
            @company_id,
            @bank_name,
            @account_no,
            @account_type,
            @branch_city,
            @bank_address,
            @swift_no,
            @micr_no,
            @ifsc_code,
            @active
          )
        `)
    }

    return res.status(200).json({
      success: true,
      message: 'Company updated successfully',
    })
  } catch (error) {
    console.log('UPDATE COMPANY ERROR:', error)

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ==========================================
// DELETE COMPANY (SOFT DELETE)
// ==========================================
exports.deleteCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    const companyId = req.params.id

    // 1. Delete company (soft delete)
    await pool
      .request()
      .input('id', sql.Int, companyId)
      .input('deleted_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('deleted_on', sql.DateTime, new Date()).query(`
        UPDATE companies
        SET
          active = '1',
          deleted_by = @deleted_by,
          deleted_on = @deleted_on
        WHERE id = @id
      `)

    // 2. Delete all banks (soft delete)
    await pool.request().input('company_id', sql.Int, companyId).query(`
        UPDATE company_banks
        SET active = '1'
        WHERE company_id = @company_id
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

    let whereClause = "WHERE c.active = '0'"
    const request = pool.request()

    if (searchFields) {
      const fields = JSON.parse(searchFields)
      const conditions = []

      fields.forEach((item, index) => {
        const paramName = `search${index}`

        switch (item.field) {
          case 'companyName':
            conditions.push(`c.company_name LIKE @${paramName}`)
            break
          case 'contactPersonName':
            conditions.push(`c.contact_person LIKE @${paramName}`)
            break
          case 'emailId':
            conditions.push(`c.email_id LIKE @${paramName}`)
            break
          case 'contactNo':
            conditions.push(`c.contact_no LIKE @${paramName}`)
            break
          case 'city':
            conditions.push(`c.city_name LIKE @${paramName}`)
            break
        }

        request.input(paramName, sql.VarChar, `%${item.keyword}%`)
      })

      if (conditions.length > 0) {
        whereClause += ` AND (${conditions.join(' OR ')})`
      }
    }

    if (fromDate && toDate) {
      whereClause += `
        AND CAST(c.created_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const result = await request.query(`
      SELECT
        c.company_name AS 'Company Name',
        c.contact_person AS 'Contact Person',
        c.email_id AS 'Email',
        c.contact_no AS 'Contact Number',
        c.city_name AS 'City',
        c.gst_no AS 'GST Number',
        c.website AS 'Website',
        c.created_on AS 'Created On',

        (
          SELECT COUNT(*)
          FROM company_banks cb
          WHERE cb.company_id = c.id
          AND cb.active = '0'
        ) AS 'Bank Count'

      FROM companies c
      ${whereClause}
      ORDER BY c.id DESC
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

exports.restoreCompany = async (req, res) => {
  try {
    const pool = await poolPromise

    const companyId = req.params.id

    // 1. Restore company
    await pool
      .request()
      .input('id', sql.Int, companyId)
      .input('modified_by', sql.VarChar(sql.MAX), String(req.user.id))
      .input('modified_on', sql.DateTime, new Date()).query(`
        UPDATE companies
        SET
          active = '0',
          modified_by = @modified_by,
          modified_on = @modified_on
        WHERE id = @id
      `)

    // 2. Restore all banks
    await pool.request().input('company_id', sql.Int, companyId).query(`
        UPDATE company_banks
        SET active = '0'
        WHERE company_id = @company_id
      `)

    return res.status(200).json({
      success: true,
      message: 'Company restored successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.getDeletedCompanies = async (req, res) => {
  try {
    const pool = await poolPromise

    const { searchFields, fromDate, toDate } = req.query

    let whereClause = "WHERE c.active = '1'"
    const request = pool.request()

    if (searchFields) {
      const fields = JSON.parse(searchFields)
      const conditions = []

      fields.forEach((item, index) => {
        const paramName = `search${index}`

        switch (item.field) {
          case 'companyName':
            conditions.push(`c.company_name LIKE @${paramName}`)
            break

          case 'contactPersonName':
            conditions.push(`c.contact_person LIKE @${paramName}`)
            break

          case 'emailId':
            conditions.push(`c.email_id LIKE @${paramName}`)
            break

          case 'contactNo':
            conditions.push(`c.contact_no LIKE @${paramName}`)
            break

          case 'city':
            conditions.push(`c.city_name LIKE @${paramName}`)
            break
        }

        request.input(paramName, sql.VarChar, `%${item.keyword}%`)
      })

      if (conditions.length > 0) {
        whereClause += ` AND (${conditions.join(' OR ')})`
      }
    }

    if (fromDate && toDate) {
      whereClause += `
        AND CAST(c.deleted_on AS DATE)
        BETWEEN @fromDate AND @toDate
      `

      request.input('fromDate', sql.Date, fromDate)
      request.input('toDate', sql.Date, toDate)
    }

    const result = await request.query(`
      SELECT
        c.*,

        (
          SELECT COUNT(*)
          FROM company_banks cb
          WHERE cb.company_id = c.id
        ) AS bank_count

      FROM companies c
      ${whereClause}
      ORDER BY c.id DESC
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

exports.getCompanyCounts = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        COUNT(*) totalCompanies,
        SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) approvedCompanies,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) deletedCompanies
      FROM companies
    `)

    res.json(result.recordset[0])
  } catch (err) {
    res.status(500).json({
      message: err.message,
    })
  }
}
