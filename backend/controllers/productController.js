const { poolPromise, sql } = require('../config/db')

function safeTime(t) {
  if (!t) return null

  // already HH:mm or HH:mm:ss
  if (typeof t === 'string') {
    const match = t.match(/^(\d{2}):(\d{2})/)
    if (match) {
      const date = new Date()
      date.setHours(+match[1])
      date.setMinutes(+match[2])
      date.setSeconds(0)
      return date
    }
  }

  return null
}

exports.createProduct = async (req, res) => {
  try {
    const {
      pcat_id,
      category_id,
      subcategory_id,
      product_name,
      gst,
      price,
      available_for_days,
      start_time,
      end_time,
    } = req.body

    const image1 = req.files?.image1?.[0]?.filename || null
    const image2 = req.files?.image2?.[0]?.filename || null
    const image3 = req.files?.image3?.[0]?.filename || null
    const image4 = req.files?.image4?.[0]?.filename || null

    const pool = await poolPromise

    await pool
      .request()
      .input('pcat_id', sql.BigInt, pcat_id)
      .input('category_id', sql.BigInt, category_id)
      .input('subcategory_id', sql.BigInt, subcategory_id)
      .input('product_name', sql.NVarChar, product_name)
      .input('image1', sql.NVarChar, image1)
      .input('image2', sql.NVarChar, image2)
      .input('image3', sql.NVarChar, image3)
      .input('image4', sql.NVarChar, image4)
      .input('gst', sql.Decimal(10, 2), gst || 0)
      .input('price', sql.Decimal(18, 2), price || 0)
      .input('available_for_days', sql.NVarChar, available_for_days || null)
      .input('start_time', sql.Time, safeTime(start_time) || null)
      .input('end_time', sql.Time, safeTime(end_time) || null).query(`
        INSERT INTO products (
          pcat_id, category_id, subcategory_id, product_name,
          image1, image2, image3, image4,
          gst, price,
          available_for_days, start_time, end_time,
          active, created_on
        )
        VALUES (
          @pcat_id, @category_id, @subcategory_id, @product_name,
          @image1, @image2, @image3, @image4,
          @gst, @price,
          @available_for_days, @start_time, @end_time,
          '0', GETDATE()
        )
      `)

    res.json({ success: true, message: 'Product Added Successfully' })
  } catch (err) {
    console.error('CREATE PRODUCT ERROR:', err) // 👈 IMPORTANT
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.getProducts = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
  p.id,
  pc.primary_categories_name,
  c.category_name,
  s.subcategory_name,
  p.product_name,
  p.image1,
  p.image2,
  p.image3,
  p.image4,
  p.gst,
  p.price,
  p.pcat_id,
  p.category_id,
  p.subcategory_id,
  p.available_for_days,
  p.start_time,
  p.end_time,
  p.active
FROM products p
LEFT JOIN primary_categories pc ON pc.id = p.pcat_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN subcategories s ON s.id = p.subcategory_id
ORDER BY p.id DESC
    `)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params

    const {
      pcat_id,
      category_id,
      subcategory_id,
      product_name,
      gst,
      price,
      available_for_days,
      start_time,
      end_time,
    } = req.body

    const image1 = req.files?.image1?.[0]?.filename || ''
    const image2 = req.files?.image2?.[0]?.filename || ''
    const image3 = req.files?.image3?.[0]?.filename || ''
    const image4 = req.files?.image4?.[0]?.filename || ''

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('pcat_id', sql.BigInt, pcat_id)
      .input('category_id', sql.BigInt, category_id)
      .input('subcategory_id', sql.BigInt, subcategory_id)
      .input('product_name', sql.NVarChar, product_name)
      .input('gst', sql.Decimal(10, 2), gst || 0)
      .input('price', sql.Decimal(18, 2), price || 0)
      .input('available_for_days', sql.NVarChar, available_for_days || null)
      .input('start_time', sql.Time, safeTime(start_time) || null)
      .input('end_time', sql.Time, safeTime(end_time) || null)
      .input('image1', sql.NVarChar, image1)
      .input('image2', sql.NVarChar, image2)
      .input('image3', sql.NVarChar, image3)
      .input('image4', sql.NVarChar, image4).query(`
        UPDATE products
        SET
          pcat_id = @pcat_id,
          category_id = @category_id,
          subcategory_id = @subcategory_id,
          product_name = @product_name,
          gst = @gst,
          price = @price,
          available_for_days = @available_for_days,
          start_time = @start_time,
          end_time = @end_time,

          image1 = CASE WHEN @image1='' THEN image1 ELSE @image1 END,
          image2 = CASE WHEN @image2='' THEN image2 ELSE @image2 END,
          image3 = CASE WHEN @image3='' THEN image3 ELSE @image3 END,
          image4 = CASE WHEN @image4='' THEN image4 ELSE @image4 END,

          modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({ success: true, message: 'Product Updated Successfully' })
  } catch (err) {
    console.error('UPDATE PRODUCT ERROR:', err) // 👈 MUST ADD
    res.status(500).json({ success: false, message: err.message })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.BigInt, id).query(`
        UPDATE products
        SET
          active = '1',
          disabled_on = GETDATE()
        WHERE id = @id
      `)

    res.json({
      success: true,
      message: 'Deleted',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.restoreProduct = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.BigInt, id).query(`
        UPDATE products
        SET
          active = '0',
          modified_on = GETDATE()
        WHERE id = @id
      `)

    res.json({
      success: true,
      message: 'Restored',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}
