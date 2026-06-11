const XLSX = require('xlsx')
const CompanyModel = require('../models/companyModels')

// ==========================================
// CREATE COMPANY
// ==========================================
exports.createCompany = async (req, res) => {
  try {
    const image = req.file ? req.file.filename : null

    const companyId = await CompanyModel.addCompany(req.body, image, req.user.id)

    const banks = req.body.banks ? JSON.parse(req.body.banks) : []
    if (banks.length > 0) {
      await CompanyModel.addCompanyBanks(companyId, banks)
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
    const { searchFields, fromDate, toDate } = req.query

    const companies = await CompanyModel.getCompanies(searchFields, fromDate, toDate)

    return res.status(200).json({
      success: true,
      data: companies,
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
// GET SINGLE COMPANY
// ==========================================
exports.getCompanyById = async (req, res) => {
  try {
    const companyResult = await CompanyModel.getCompanyById(req.params.id)

    if (!companyResult.length) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      })
    }

    const banksResult = await CompanyModel.getCompanyBanks(req.params.id)

    return res.status(200).json({
      success: true,
      data: {
        ...companyResult[0],
        banks: banksResult,
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
    const companyId = req.params.id
    const image = req.file ? req.file.filename : null

    // 1. UPDATE COMPANY
    await CompanyModel.updateCompany(companyId, req.body, image, req.user.id)

    // 2. MARK OLD BANKS INACTIVE (IMPORTANT FIX)
    await CompanyModel.deactivateCompanyBanks(companyId)

    // 3. INSERT NEW BANKS
    const banks = req.body.banks ? JSON.parse(req.body.banks) : []
    if (banks.length > 0) {
      await CompanyModel.addCompanyBanks(companyId, banks)
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
    const companyId = req.params.id

    // 1. Delete company (soft delete)
    await CompanyModel.softDeleteCompany(companyId, req.user.id)

    // 2. Delete all banks (soft delete)
    await CompanyModel.softDeleteCompanyBanks(companyId)

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
    const { searchFields, fromDate, toDate } = req.query

    const result = await CompanyModel.getExportCompanies(searchFields, fromDate, toDate)

    const worksheet = XLSX.utils.json_to_sheet(result)
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
    const companyId = req.params.id

    // 1. Restore company
    await CompanyModel.restoreCompany(companyId, req.user.id)

    // 2. Restore all banks
    await CompanyModel.restoreCompanyBanks(companyId)

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
    const { searchFields, fromDate, toDate } = req.query

    const result = await CompanyModel.getDeletedCompanies(searchFields, fromDate, toDate)

    return res.status(200).json({
      success: true,
      data: result,
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
    const result = await CompanyModel.getCompanyCounts()
    res.json(result)
  } catch (err) {
    res.status(500).json({
      message: err.message,
    })
  }
}
