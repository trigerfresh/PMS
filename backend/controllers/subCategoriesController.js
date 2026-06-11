const XLSX = require('xlsx')
const SubCategoryModel = require('../models/subCategoryModels')

exports.createSubcategory = async (req, res) => {
  try {
    const { category_id, subcategory_name } = req.body
    const image = req.file ? req.file.filename : null

    await SubCategoryModel.createSubcategory(category_id, subcategory_name, image)

    res.json({
      success: true,
      message: 'Subcategory created successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getSubcategories = async (req, res) => {
  try {
    const data = await SubCategoryModel.getSubcategories()

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category_id, subcategory_name } = req.body
    const image = req.file ? req.file.filename : null

    await SubCategoryModel.updateSubcategory(id, category_id, subcategory_name, image)

    res.json({
      success: true,
      message: 'Updated',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params

    await SubCategoryModel.deleteSubcategory(id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restoreSubcategory = async (req, res) => {
  try {
    const { id } = req.params

    await SubCategoryModel.restoreSubcategory(id)

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.searchSubcategories = async (req, res) => {
  try {
    const { keyword } = req.query

    const data = await SubCategoryModel.searchSubcategories(keyword)

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.downloadSubcategoriesXlsx = async (req, res) => {
  try {
    const data = await SubCategoryModel.getSubcategoriesForDownload()

    // Convert JSON → worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Create workbook
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Subcategories')

    // Generate buffer (important for backend download)
    const buffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    // Response headers
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="subcategories.xlsx"',
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    // Send file
    res.send(buffer)
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
