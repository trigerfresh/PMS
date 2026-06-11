const CategoryModel = require('../models/categoriesModels')

exports.createCategory = async (req, res) => {
  try {
    const { category_name, pcat_id } = req.body
    const image = req.file ? req.file.filename : null

    await CategoryModel.createCategory(category_name, pcat_id, image)

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

exports.getCategories = async (req, res) => {
  try {
    const data = await CategoryModel.getCategories()

    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params
    const { category_name, pcat_id } = req.body
    const image = req.file ? req.file.filename : null

    await CategoryModel.updateCategory(id, category_name, pcat_id, image)

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

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params

    await CategoryModel.deleteCategory(id)

    res.json({ success: true, message: 'Category deleted' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.restoreCategory = async (req, res) => {
  try {
    const { id } = req.params

    await CategoryModel.restoreCategory(id)

    res.json({ success: true, message: 'Category restored' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getPrimaryCategoryDropdown = async (req, res) => {
  try {
    const data = await CategoryModel.getPrimaryCategoryDropdown()

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
