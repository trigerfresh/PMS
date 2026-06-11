const ProductModel = require('../models/productModels')

exports.createProduct = async (req, res) => {
  try {
    let availability = []
    if (req.body.availability) {
      try {
        availability = JSON.parse(req.body.availability)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid availability JSON format',
        })
      }
    }

    const productData = {
      ...req.body,
      availability,
    }

    const productId = await ProductModel.createProduct(productData, req.files)

    res.json({
      success: true,
      message: 'Product Added Successfully',
      product_id: productId,
    })
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err)
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getProducts = async (req, res) => {
  try {
    const recordset = await ProductModel.getProducts()

    const grouped = {}

    recordset.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,

          hotel_id: row.hotel_id,
          hotel_name: row.hotel_name,

          branch_id: row.branch_id,
          branch_name: row.branch_name,

          pcat_id: row.pcat_id,
          category_id: row.category_id,
          subcategory_id: row.subcategory_id,

          primary_categories_name: row.primary_categories_name,
          category_name: row.category_name,
          subcategory_name: row.subcategory_name,

          product_name: row.product_name,

          image1: row.image1,
          image2: row.image2,
          image3: row.image3,
          image4: row.image4,

          gst: row.gst,
          price: row.price,
          description: row.description,

          active: row.active,

          availability: [],
        }
      }

      if (row.available_day) {
        grouped[row.id].availability.push({
          available_day: row.available_day,
          start_time: row.start_time,
          end_time: row.end_time,
        })
      }
    })

    return res.status(200).json({
      success: true,
      count: Object.keys(grouped).length,
      data: Object.values(grouped),
    })
  } catch (err) {
    console.log('GET PRODUCTS ERROR:', err)

    return res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    let availability = []
    if (req.body.availability) {
      try {
        availability = JSON.parse(req.body.availability)
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid availability JSON format',
        })
      }
    }

    const productData = {
      ...req.body,
      availability,
    }

    await ProductModel.updateProduct(id, productData, req.files)

    res.json({
      success: true,
      message: 'Product Updated Successfully',
    })
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err)

    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    await ProductModel.deleteProduct(id)

    res.json({
      success: true,
      message: 'Product Deleted Successfully',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.restoreProduct = async (req, res) => {
  try {
    const { id } = req.params

    await ProductModel.restoreProduct(id)

    res.json({
      success: true,
      message: 'Product Restored Successfully',
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
