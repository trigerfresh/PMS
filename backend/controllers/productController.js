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
    const { pcat_id, category_id, subcategory_id, product_name, gst, price } =
      req.body

    // Parse availability from form-data
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

    console.log(req.body.availability)
    console.log(typeof req.body.availability)

    const image1 = req.files?.image1?.[0]?.filename || null
    const image2 = req.files?.image2?.[0]?.filename || null
    const image3 = req.files?.image3?.[0]?.filename || null
    const image4 = req.files?.image4?.[0]?.filename || null

    const pool = await poolPromise

    // Create Product
    const productResult = await pool
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
      .input('price', sql.Decimal(18, 2), price || 0).query(`
        INSERT INTO products (
          pcat_id,
          category_id,
          subcategory_id,
          product_name,
          image1,
          image2,
          image3,
          image4,
          gst,
          price,
          active,
          created_on
        )
        OUTPUT INSERTED.id
        VALUES (
          @pcat_id,
          @category_id,
          @subcategory_id,
          @product_name,
          @image1,
          @image2,
          @image3,
          @image4,
          @gst,
          @price,
          '0',
          GETDATE()
        )
      `)

    const productId = productResult.recordset[0].id

    // Insert Availability Rows
    if (Array.isArray(availability) && availability.length > 0) {
      for (const item of availability) {
        await pool
          .request()
          .input('product_id', sql.BigInt, productId)
          .input('available_day', sql.NVarChar, item.available_day || null)
          .input('start_time', sql.VarChar(20), item.start_time || null)
          .input('end_time', sql.VarChar(20), item.end_time || null).query(`
            INSERT INTO product_availability (
              product_id,
              available_day,
              start_time,
              end_time,
              active,
              created_on
            )
            VALUES (
              @product_id,
              @available_day,
              @start_time,
              @end_time,
              '0',
              GETDATE()
            )
          `)
      }
    }

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
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        p.id,
        p.product_name,
        p.image1,
        p.image2,
        p.image3,
        p.image4,
        p.gst,
        p.price,
        p.active,

        p.pcat_id,
        p.category_id,
        p.subcategory_id,

        pc.primary_categories_name,
        c.category_name,
        s.subcategory_name,

        pa.available_day,
        pa.start_time,
        pa.end_time

      FROM products p

      LEFT JOIN primary_categories pc
        ON pc.id = p.pcat_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN subcategories s
        ON s.id = p.subcategory_id

      LEFT JOIN product_availability pa
        ON pa.product_id = p.id

      ORDER BY p.id DESC
    `)

    const grouped = {}

    result.recordset.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
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

    res.json({
      success: true,
      data: Object.values(grouped),
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

    const { pcat_id, category_id, subcategory_id, product_name, gst, price } =
      req.body

    // Parse availability JSON
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

    const image1 = req.files?.image1?.[0]?.filename || ''
    const image2 = req.files?.image2?.[0]?.filename || ''
    const image3 = req.files?.image3?.[0]?.filename || ''
    const image4 = req.files?.image4?.[0]?.filename || ''

    const pool = await poolPromise

    // Update Product
    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('pcat_id', sql.BigInt, pcat_id)
      .input('category_id', sql.BigInt, category_id)
      .input('subcategory_id', sql.BigInt, subcategory_id)
      .input('product_name', sql.NVarChar, product_name)
      .input('gst', sql.Decimal(10, 2), gst || 0)
      .input('price', sql.Decimal(18, 2), price || 0)
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

          image1 = CASE WHEN @image1='' THEN image1 ELSE @image1 END,
          image2 = CASE WHEN @image2='' THEN image2 ELSE @image2 END,
          image3 = CASE WHEN @image3='' THEN image3 ELSE @image3 END,
          image4 = CASE WHEN @image4='' THEN image4 ELSE @image4 END,

          modified_on = GETDATE()

        WHERE id = @id
      `)

    // Remove old availability
    await pool.request().input('product_id', sql.BigInt, id).query(`
        DELETE FROM product_availability
        WHERE product_id = @product_id
      `)

    // Insert new availability
    if (Array.isArray(availability) && availability.length > 0) {
      for (const item of availability) {
        await pool
          .request()
          .input('product_id', sql.BigInt, id)
          .input('available_day', sql.NVarChar, item.available_day || null)
          .input('start_time', sql.VarChar(20), item.start_time || null)
          .input('end_time', sql.VarChar(20), item.end_time || null).query(`
            INSERT INTO product_availability (
              product_id,
              available_day,
              start_time,
              end_time,
              active,
              created_on
            )
            VALUES (
              @product_id,
              @available_day,
              @start_time,
              @end_time,
              '0',
              GETDATE()
            )
          `)
      }
    }

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

    const pool = await poolPromise

    // Product inactive
    await pool.request().input('id', sql.BigInt, id).query(`
      UPDATE products
      SET
        active = '1',
        disabled_on = GETDATE()
      WHERE id = @id
    `)

    // All availability rows inactive
    await pool.request().input('product_id', sql.BigInt, id).query(`
      UPDATE product_availability
      SET
        active = '1'
      WHERE product_id = @product_id
    `)

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

    const pool = await poolPromise

    // Product active
    await pool.request().input('id', sql.BigInt, id).query(`
      UPDATE products
      SET
        active = '0',
        modified_on = GETDATE()
      WHERE id = @id
    `)

    // All availability rows active
    await pool.request().input('product_id', sql.BigInt, id).query(`
      UPDATE product_availability
      SET
        active = '0'
      WHERE product_id = @product_id
    `)

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
