const { poolPromise, sql } = require('../config/db')

/* CREATE */
exports.createFood = async (req, res) => {
  try {
    const pool = await poolPromise

    const { category, primary_category, food_name, price } = req.body

    const basePrice = parseFloat(price || 0)

    const gst = +(basePrice * 0.18).toFixed(2)
    const total_price = +(basePrice + gst).toFixed(2)

    const img1 = req.files?.img1?.[0]?.filename || null
    const img2 = req.files?.img2?.[0]?.filename || null
    const img3 = req.files?.img3?.[0]?.filename || null
    const img4 = req.files?.img4?.[0]?.filename || null

    await pool
      .request()
      .input('category', sql.NVarChar, category)
      .input('primary_category', sql.NVarChar, primary_category)
      .input('food_name', sql.NVarChar, food_name)
      .input('img1', sql.NVarChar, img1)
      .input('img2', sql.NVarChar, img2)
      .input('img3', sql.NVarChar, img3)
      .input('img4', sql.NVarChar, img4)
      .input('price', sql.Decimal(10, 2), basePrice)
      .input('gst', sql.Decimal(10, 2), gst)
      .input('total_price', sql.Decimal(10, 2), total_price).query(`
        INSERT INTO food_master (
          category,
          primary_category,
          food_name,
          img1,
          img2,
          img3,
          img4,
          price,
          gst,
          total_price,
          active,
          created_at
        )
        VALUES (
          @category,
          @primary_category,
          @food_name,
          @img1,
          @img2,
          @img3,
          @img4,
          @price,
          @gst,
          @total_price,
          0,
          GETDATE()
        )
      `)

    res.status(201).json({
      success: true,
      message: 'Food Created Successfully',
      gst,
      total_price,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getFoods = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM food_master
      WHERE active = 0
      ORDER BY food_id ASC
    `)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message })
  }
}

exports.getFoodById = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    const result = await pool.request().input('food_id', sql.Int, id).query(`
        SELECT *
        FROM food_master
        WHERE food_id = @food_id
      `)

    res.json({
      success: true,
      data: result.recordset[0],
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message })
  }
}

exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    const food = await pool.request().input('id', sql.Int, id).query(`
      SELECT * FROM food_master
      WHERE food_id = @id
    `)

    if (food.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food not found',
      })
    }

    const oldFood = food.recordset[0]

    const { category, primary_category, food_name, price } = req.body

    const basePrice = parseFloat(price || 0)

    const gst = +(basePrice * 0.18).toFixed(2)
    const total_price = +(basePrice + gst).toFixed(2)

    const img1 = req.files?.img1?.[0]?.filename || oldFood.img1
    const img2 = req.files?.img2?.[0]?.filename || oldFood.img2
    const img3 = req.files?.img3?.[0]?.filename || oldFood.img3
    const img4 = req.files?.img4?.[0]?.filename || oldFood.img4

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('category', sql.NVarChar, category)
      .input('primary_category', sql.NVarChar, primary_category)
      .input('food_name', sql.NVarChar, food_name)
      .input('img1', sql.NVarChar, img1)
      .input('img2', sql.NVarChar, img2)
      .input('img3', sql.NVarChar, img3)
      .input('img4', sql.NVarChar, img4)
      .input('price', sql.Decimal(10, 2), basePrice)
      .input('gst', sql.Decimal(10, 2), gst)
      .input('total_price', sql.Decimal(10, 2), total_price).query(`
        UPDATE food_master
        SET
          category=@category,
          primary_category=@primary_category,
          food_name=@food_name,
          img1=@img1,
          img2=@img2,
          img3=@img3,
          img4=@img4,
          price=@price,
          gst=@gst,
          total_price=@total_price,
          updated_at=GETDATE()
        WHERE food_id=@id
      `)

    res.json({
      success: true,
      message: 'Food Updated Successfully',
      gst,
      total_price,
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('food_id', sql.Int, id).query(`
        UPDATE food_master
        SET active = 1,
            updated_at = GETDATE()
        WHERE food_id = @food_id
      `)

    res.json({
      success: true,
      message: 'Food Deleted Successfully',
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({ message: err.message })
  }
}
