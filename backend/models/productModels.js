const { poolPromise, sql } = require('../config/db')

class ProductModel {
  static async createProduct(productData, files) {
    const {
      hotel_id,
      branch_id,
      pcat_id,
      category_id,
      subcategory_id,
      product_name,
      gst,
      price,
      description,
      availability,
    } = productData

    const image1 = files?.image1?.[0]?.filename || null
    const image2 = files?.image2?.[0]?.filename || null
    const image3 = files?.image3?.[0]?.filename || null
    const image4 = files?.image4?.[0]?.filename || null

    const pool = await poolPromise

    const productResult = await pool
      .request()
      .input('hotel_id', sql.VarChar(10), hotel_id)
      .input('branch_id', sql.Int, branch_id)
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
      .input('description', sql.NVarChar, description || null).query(`
      INSERT INTO products (
        hotel_id,
        branch_id,
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
        description,
        active,
        created_on
      )
      OUTPUT INSERTED.id
      VALUES (
        @hotel_id,
        @branch_id,
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
        @description,
        '0',
        GETDATE()
      )
  `)

    const productId = productResult.recordset[0].id

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

    return productId
  }

  static async getProducts() {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        p.id,

        p.hotel_id,
        p.branch_id,

        h.hotel_name,
        b.branch_name,

        p.pcat_id,
        p.category_id,
        p.subcategory_id,

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
        p.description,
        p.active,

        pa.available_day,
        pa.start_time,
        pa.end_time

      FROM products p

      LEFT JOIN hotel h
        ON h.id = TRY_CAST(p.hotel_id AS INT)

      LEFT JOIN branch b
        ON b.id = p.branch_id

      LEFT JOIN primary_categories pc
        ON pc.id = p.pcat_id

      LEFT JOIN categories c
        ON c.id = p.category_id

      LEFT JOIN subcategories s
        ON s.id = p.subcategory_id

      LEFT JOIN product_availability pa
        ON pa.product_id = p.id
        AND pa.active = '0'

      ORDER BY p.id DESC
    `)

    return result.recordset
  }

  static async updateProduct(id, productData, files) {
    const {
      hotel_id,
      branch_id,
      pcat_id,
      category_id,
      subcategory_id,
      product_name,
      gst,
      price,
      description,
      availability,
    } = productData

    const image1 = files?.image1?.[0]?.filename || ''
    const image2 = files?.image2?.[0]?.filename || ''
    const image3 = files?.image3?.[0]?.filename || ''
    const image4 = files?.image4?.[0]?.filename || ''

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.BigInt, id)
      .input('hotel_id', sql.VarChar(10), hotel_id)
      .input('branch_id', sql.Int, branch_id)
      .input('pcat_id', sql.BigInt, pcat_id)
      .input('category_id', sql.BigInt, category_id)
      .input('subcategory_id', sql.BigInt, subcategory_id)
      .input('product_name', sql.NVarChar, product_name)
      .input('gst', sql.Decimal(10, 2), gst || 0)
      .input('price', sql.Decimal(18, 2), price || 0)
      .input('description', sql.NVarChar, description || null)
      .input('image1', sql.NVarChar, image1)
      .input('image2', sql.NVarChar, image2)
      .input('image3', sql.NVarChar, image3)
      .input('image4', sql.NVarChar, image4).query(`
      UPDATE products
      SET
        hotel_id = @hotel_id,
        branch_id = @branch_id,

        pcat_id = @pcat_id,
        category_id = @category_id,
        subcategory_id = @subcategory_id,

        product_name = @product_name,
        gst = @gst,
        price = @price,
        description = @description,

        image1 = CASE WHEN @image1='' THEN image1 ELSE @image1 END,
        image2 = CASE WHEN @image2='' THEN image2 ELSE @image2 END,
        image3 = CASE WHEN @image3='' THEN image3 ELSE @image3 END,
        image4 = CASE WHEN @image4='' THEN image4 ELSE @image4 END,

        modified_on = GETDATE()

      WHERE id = @id
  `)

    await pool.request().input('product_id', sql.BigInt, id).query(`
        DELETE FROM product_availability
        WHERE product_id = @product_id
      `)

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
  }

  static async deleteProduct(id) {
    const pool = await poolPromise

    await pool.request().input('id', sql.BigInt, id).query(`
      UPDATE products
      SET
        active = '1',
        disabled_on = GETDATE()
      WHERE id = @id
    `)

    await pool.request().input('product_id', sql.BigInt, id).query(`
      UPDATE product_availability
      SET
        active = '1'
      WHERE product_id = @product_id
    `)
  }

  static async restoreProduct(id) {
    const pool = await poolPromise

    await pool.request().input('id', sql.BigInt, id).query(`
      UPDATE products
      SET
        active = '0',
        modified_on = GETDATE()
      WHERE id = @id
    `)

    await pool.request().input('product_id', sql.BigInt, id).query(`
      UPDATE product_availability
      SET
        active = '0'
      WHERE product_id = @product_id
    `)
  }
}

module.exports = ProductModel
