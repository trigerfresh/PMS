const XLSX = require('xlsx')
const PrimaryCategoryModel = require('../models/primaryCategoryModels')

exports.createPrimaryCategory = async (req, res) => {
  try {
    const { primary_categories_name } = req.body
    const image = req.file ? req.file.filename : null

    await PrimaryCategoryModel.createPrimaryCategory(primary_categories_name, image)

    res.json({
      success: true,
      message: 'Category created',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getPrimaryCategories = async (req, res) => {
  try {
    const data = await PrimaryCategoryModel.getPrimaryCategories()

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updatePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { primary_categories_name } = req.body
    const image = req.file ? req.file.filename : null

    await PrimaryCategoryModel.updatePrimaryCategory(id, primary_categories_name, image)

    res.json({
      success: true,
      message: 'Category updated',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deletePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params

    await PrimaryCategoryModel.deletePrimaryCategory(id)

    res.json({ success: true, message: 'Category deleted (soft)' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restorePrimaryCategory = async (req, res) => {
  try {
    const { id } = req.params

    await PrimaryCategoryModel.restorePrimaryCategory(id)

    res.json({ success: true, message: 'Category restored' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.searchPrimaryCategories = async (req, res) => {
  try {
    const { primary_categories_name } = req.query

    const data = await PrimaryCategoryModel.searchPrimaryCategories(primary_categories_name)

    res.json({
      success: true,
      data,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.exportExcel = async (req, res) => {
  try {
    const data = await PrimaryCategoryModel.exportExcel()

    // Convert JSON → Excel sheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PrimaryCategories')

    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=primary_categories.xlsx',
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}
