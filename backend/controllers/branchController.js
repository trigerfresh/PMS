const xlsx = require('xlsx')
const BranchModel = require('../models/branchModels')

// ==========================================
// CREATE BRANCH
// ==========================================
exports.createBranch = async (req, res) => {
  try {
    await BranchModel.createBranch(req.body, req.user.id)

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

    const rows = await BranchModel.getBranchesSearch(searchFields, fromDate, toDate)

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
    const { status, searchFields, fromDate, toDate, company_id } = req.query

    const result = await BranchModel.getBranches(status, searchFields, fromDate, toDate, company_id)

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('getBranches error:', error)
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
    const branch = await BranchModel.getBranchById(req.params.id)

    return res.status(200).json({
      success: true,
      data: branch,
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
    await BranchModel.updateBranch(req.params.id, req.body, req.user.id)

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
    await BranchModel.deleteBranch(req.params.id, req.user.id)

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

    const rows = await BranchModel.exportBranches(searchFields, fromDate, toDate)

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
    await BranchModel.restoreBranch(req.params.id, req.user.id)

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
    const { searchFields, fromDate, toDate } = req.query

    const rows = await BranchModel.getDeletedBranches(searchFields, fromDate, toDate)

    return res.status(200).json({
      success: true,
      data: rows,
    })
  } catch (error) {
    console.log('GET DELETED BRANCH ERROR:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
