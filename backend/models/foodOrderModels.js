const { poolPromise, sql } = require('../config/db')

class FoodOrderModel {
  static async createFoodOrder(data) {
    const pool = await poolPromise
    const request = pool.request()

    // Generate sequential order_id starting from 1
    const maxRes = await pool.request().query('SELECT MAX(CAST(order_id AS BIGINT)) as max_id FROM food_order');
    const nextOrderId = maxRes.recordset[0].max_id ? Number(maxRes.recordset[0].max_id) + 1 : 1;

    request.input('order_id', sql.BigInt, nextOrderId)
    request.input('hotel_id', sql.Int, data.hotel_id)
    request.input('branch_id', sql.Int, data.branch_id)
    request.input('booking_id', sql.Int, data.booking_id)
    request.input('room_id', sql.Int, data.room_id)
    request.input('floor_id', sql.Int, data.floor_id)
    request.input('room_no', sql.NVarChar(20), data.room_no)
    request.input('customer_name', sql.NVarChar(100), data.customer_name)

    request.input('pcat_id', sql.BigInt, data.pcat_id)
    request.input(
      'primary_category_name',
      sql.NVarChar(255),
      data.primary_category_name,
    )
    request.input('category_id', sql.BigInt, data.category_id)
    request.input('category_name', sql.NVarChar(255), data.category_name)
    request.input('subcategory_id', sql.BigInt, data.subcategory_id)
    request.input('subcategory_name', sql.NVarChar(255), data.subcategory_name)
    request.input('product_id', sql.BigInt, data.product_id)
    request.input('product_name', sql.NVarChar(255), data.product_name)
    request.input('product_image', sql.NVarChar(50), data.product_image)
    request.input('image', sql.NVarChar(50), data.product_image)

    request.input('qty', sql.NVarChar(50), String(data.qty || '0'))
    request.input('price', sql.NVarChar(50), String(data.price || '0'))
    request.input('gst', sql.NVarChar(50), String(data.gst || '0'))
    request.input('amount', sql.NVarChar(50), String(data.amount || '0'))

    request.input(
      'order_status',
      sql.NVarChar(50),
      data.order_status || 'Ordered',
    )
    request.input('total_amount', sql.NVarChar(50), String(data.total_amount || '0'))
    request.input('gst_amount', sql.NVarChar(50), String(data.gst_amount || '0'))
    request.input('grand_total', sql.NVarChar(50), String(data.grand_total || '0'))
    request.input('remarks', sql.NVarChar(500), data.remarks)
    request.input('created_by', sql.NVarChar(50), data.created_by)

    await request.query(`
      INSERT INTO food_order (
        order_id, hotel_id, branch_id, booking_id, room_id, floor_id, room_no, customer_name,
        pcat_id, primary_category_name, category_id, category_name, subcategory_id, subcategory_name,
        product_id, product_name, product_image, image, qty, price, gst, amount, order_status, total_amount, gst_amount, grand_total, remarks, created_on, created_by, active
      ) VALUES (
        @order_id, @hotel_id, @branch_id, @booking_id, @room_id, @floor_id, @room_no, @customer_name,
        @pcat_id, @primary_category_name, @category_id, @category_name, @subcategory_id, @subcategory_name,
        @product_id, @product_name, @product_image, @image, @qty, @price, @gst, @amount, @order_status, @total_amount, @gst_amount, @grand_total, @remarks, GETDATE(), @created_by, '0'
      )
    `)
  }

  static async getFoodOrders() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT fo.*, h.hotel_name, h.branch_name, f.floor_name
      FROM food_order fo
      LEFT JOIN hotel h ON fo.hotel_id = h.id
      LEFT JOIN floor_master f ON fo.floor_id = f.floor_id
      ORDER BY fo.order_detail_id DESC
    `)
    return result.recordset
  }

  static async getFoodOrderById(id) {
    const pool = await poolPromise
    const result = await pool.request().input('id', sql.BigInt, id).query(`
        SELECT *
        FROM food_order
        WHERE order_detail_id = @id
      `)
    return result.recordset[0]
  }

  static async updateFoodOrder(id, data) {
    const pool = await poolPromise
    const request = pool.request()

    request.input('id', sql.BigInt, id)
    request.input('order_id', sql.BigInt, data.order_id)
    request.input('hotel_id', sql.Int, data.hotel_id)
    request.input('branch_id', sql.Int, data.branch_id)
    request.input('booking_id', sql.Int, data.booking_id)
    request.input('room_id', sql.Int, data.room_id)
    request.input('floor_id', sql.Int, data.floor_id)
    request.input('room_no', sql.NVarChar(20), data.room_no)
    request.input('customer_name', sql.NVarChar(100), data.customer_name)

    request.input('pcat_id', sql.BigInt, data.pcat_id)
    request.input(
      'primary_category_name',
      sql.NVarChar(255),
      data.primary_category_name,
    )
    request.input('category_id', sql.BigInt, data.category_id)
    request.input('category_name', sql.NVarChar(255), data.category_name)
    request.input('subcategory_id', sql.BigInt, data.subcategory_id)
    request.input('subcategory_name', sql.NVarChar(255), data.subcategory_name)
    request.input('product_id', sql.BigInt, data.product_id)
    request.input('product_name', sql.NVarChar(255), data.product_name)
    request.input('product_image', sql.NVarChar(50), data.product_image)
    request.input('image', sql.NVarChar(50), data.product_image)

    request.input('qty', sql.NVarChar(50), String(data.qty || '0'))
    request.input('price', sql.NVarChar(50), String(data.price || '0'))
    request.input('gst', sql.NVarChar(50), String(data.gst || '0'))
    request.input('amount', sql.NVarChar(50), String(data.amount || '0'))

    request.input(
      'order_status',
      sql.NVarChar(50),
      data.order_status || 'Ordered',
    )
    request.input('total_amount', sql.NVarChar(50), String(data.total_amount || '0'))
    request.input('gst_amount', sql.NVarChar(50), String(data.gst_amount || '0'))
    request.input('grand_total', sql.NVarChar(50), String(data.grand_total || '0'))
    request.input('remarks', sql.NVarChar(500), data.remarks)
    request.input('modified_by', sql.NVarChar(50), data.modified_by)

    await request.query(`
      UPDATE food_order
      SET 
        order_id = @order_id, hotel_id = @hotel_id, branch_id = @branch_id, booking_id = @booking_id, room_id = @room_id, floor_id = @floor_id, room_no = @room_no, customer_name = @customer_name,
        pcat_id = @pcat_id, primary_category_name = @primary_category_name, category_id = @category_id, category_name = @category_name, subcategory_id = @subcategory_id, subcategory_name = @subcategory_name,
        product_id = @product_id, product_name = @product_name, product_image = @product_image, image = @image, qty = @qty, price = @price, gst = @gst, amount = @amount,
        order_status = @order_status, total_amount = @total_amount, gst_amount = @gst_amount, grand_total = @grand_total, remarks = @remarks,
        modified_on = GETDATE(), modified_by = @modified_by
      WHERE order_detail_id = @id
    `)
  }

  static async deleteFoodOrder(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.BigInt, id).query(`
        UPDATE food_order
        SET active = '1',
            modified_on = GETDATE()
        WHERE order_detail_id = @id
      `)
  }

  static async restoreFoodOrder(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.BigInt, id).query(`
        UPDATE food_order
        SET active = '0',
            modified_on = GETDATE()
        WHERE order_detail_id = @id
      `)
  }
}

module.exports = FoodOrderModel
