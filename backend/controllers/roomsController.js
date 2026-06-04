//New code rooms controller.js
const { poolPromise, sql } = require('../config/db')

// ================= CREATE ROOM =================
exports.createRoom = async (req, res) => {
  try {
    const pool = await poolPromise

    const {
      hotel_id,
      floor_id,
      room_no,
      room_type,
      price,
      status,
      bhk,
      balcony,
      bedroom,
      kitchen,
      bathroom,
      bed_type,
      room_amenities,
      room_video_url, // ✅ TEXT URL
    } = req.body

    // ✅ FILES only for images
    const room_photo1 = req.files?.room_photo1?.[0]?.path || null
    const room_photo2 = req.files?.room_photo2?.[0]?.path || null
    const room_photo3 = req.files?.room_photo3?.[0]?.path || null
    const room_photo4 = req.files?.room_photo4?.[0]?.path || null

    // hotel name
    const hotelResult = await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .query(`SELECT hotel_name FROM hotel WHERE id=@hotel_id`)

    if (!hotelResult.recordset.length) {
      return res.status(404).json({ message: 'Hotel not found' })
    }

    const hotel_name = hotelResult.recordset[0].hotel_name

    // floor name
    const floorResult = await pool
      .request()
      .input('floor_id', sql.Int, floor_id)
      .query(`SELECT floor_name FROM floor_master WHERE floor_id=@floor_id`)

    if (!floorResult.recordset.length) {
      return res.status(404).json({ message: 'Floor not found' })
    }

    const floor_name = floorResult.recordset[0].floor_name

    // INSERT
    await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('floor_id', sql.Int, floor_id)
      .input('room_no', sql.VarChar, room_no)
      .input('room_type', sql.VarChar, room_type)
      .input('price', sql.Decimal(10, 2), price)
      .input('status', sql.VarChar, status)
      .input('bhk', sql.Int, bhk)
      .input('balcony', sql.Int, balcony)
      .input('bedroom', sql.Int, bedroom)
      .input('kitchen', sql.Int, kitchen)
      .input('bathroom', sql.Int, bathroom)
      .input('bed_type', sql.VarChar, bed_type)
      .input('room_amenities', sql.VarChar, room_amenities)
      .input('room_photo1', sql.VarChar, room_photo1)
      .input('room_photo2', sql.VarChar, room_photo2)
      .input('room_photo3', sql.VarChar, room_photo3)
      .input('room_photo4', sql.VarChar, room_photo4)
      .input('room_video_url', sql.VarChar, room_video_url) // ✅ TEXT
      .query(`
        INSERT INTO room_masters (
          hotel_id, floor_id, room_no, room_type, price, status,
          active, created_on, bhk, balcony, bedroom, kitchen, bathroom,
          bed_type, room_amenities,
          room_photo1, room_photo2, room_photo3, room_photo4, room_video_url
        )
        VALUES (
          @hotel_id, @floor_id, @room_no, @room_type, @price, @status,
          '0', GETDATE(), @bhk, @balcony, @bedroom, @kitchen, @bathroom,
          @bed_type, @room_amenities,
          @room_photo1, @room_photo2, @room_photo3, @room_photo4, @room_video_url
        )
      `)

    return res.json({
      success: true,
      message: 'Room created successfully',
      data: { hotel_name, floor_name },
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRooms = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        r.*,
        h.hotel_name,
        f.floor_name
      FROM room_masters r
      LEFT JOIN hotel h ON r.hotel_id = h.id
      LEFT JOIN floor_master f ON r.floor_id = f.floor_id
      WHERE r.active = '0'
      ORDER BY r.room_id DESC
    `)

    return res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRoomById = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().input('id', sql.Int, req.params.id)
      .query(`
        SELECT * FROM room_masters
        WHERE room_id = @id
      `)

    return res.json({
      success: true,
      data: result.recordset[0] || null,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.updateRoom = async (req, res) => {
  try {
    const pool = await poolPromise

    const roomId = req.params.roomId

    const {
      room_no,
      room_type,
      price,
      status,
      bhk,
      balcony,
      bedroom,
      kitchen,
      bathroom,
      bed_type,
      room_amenities,
      room_video_url, // ✅ TEXT URL (from body)
    } = req.body

    // ✅ FILES from multer (optional update)
    const room_photo1 = req.files?.room_photo1?.[0]?.path
    const room_photo2 = req.files?.room_photo2?.[0]?.path
    const room_photo3 = req.files?.room_photo3?.[0]?.path
    const room_photo4 = req.files?.room_photo4?.[0]?.path

    await pool
      .request()
      .input('roomId', sql.Int, roomId)
      .input('room_no', sql.VarChar, room_no)
      .input('room_type', sql.VarChar, room_type)
      .input('price', sql.Decimal(10, 2), price)
      .input('status', sql.VarChar, status)
      .input('bhk', sql.Int, bhk)
      .input('balcony', sql.Int, balcony)
      .input('bedroom', sql.Int, bedroom)
      .input('kitchen', sql.Int, kitchen)
      .input('bathroom', sql.Int, bathroom)
      .input('bed_type', sql.VarChar, bed_type)
      .input('room_amenities', sql.VarChar, room_amenities)
      .input('room_photo1', sql.VarChar, room_photo1 || null)
      .input('room_photo2', sql.VarChar, room_photo2 || null)
      .input('room_photo3', sql.VarChar, room_photo3 || null)
      .input('room_photo4', sql.VarChar, room_photo4 || null)
      .input('room_video_url', sql.VarChar, room_video_url) // ✅ TEXT
      .query(`
        UPDATE room_masters
        SET 
          room_no = @room_no,
          room_type = @room_type,
          price = @price,
          status = @status,
          bhk = @bhk,
          balcony = @balcony,
          bedroom = @bedroom,
          kitchen = @kitchen,
          bathroom = @bathroom,
          bed_type = @bed_type,
          room_amenities = @room_amenities,

          room_photo1 = COALESCE(@room_photo1, room_photo1),
          room_photo2 = COALESCE(@room_photo2, room_photo2),
          room_photo3 = COALESCE(@room_photo3, room_photo3),
          room_photo4 = COALESCE(@room_photo4, room_photo4),

          room_video_url = @room_video_url,

          updated_on = GETDATE()
        WHERE room_id = @roomId
      `)

    return res.json({
      success: true,
      message: 'Room updated successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deleteRoom = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool.request().input('roomId', sql.Int, req.params.roomId).query(`
        UPDATE room_masters
        SET active='1', updated_on=GETDATE()
        WHERE room_id=@roomId
      `)

    return res.json({
      success: true,
      message: 'Room deleted successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRoomsByFloor = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool
      .request()
      .input('floor_id', sql.Int, req.params.floorId).query(`
        SELECT *
        FROM room_masters
        WHERE floor_id = @floor_id
        AND active = '0'
      `)

    res.json({
      data: result.recordset,
    })
  } catch (err) {
    console.log(err)
    res.status(500).json({
      message: 'Error fetching rooms',
    })
  }
}

exports.searchRooms = async (req, res) => {
  try {
    const pool = await poolPromise

    const { hotel_name, floor_name, room_no, room_type, status } = req.query

    let query = `
      SELECT 
        r.*,
        h.hotel_name,
        f.floor_name
      FROM room_masters r
      LEFT JOIN hotel h ON r.hotel_id = h.id
      LEFT JOIN floor_master f ON r.floor_id = f.floor_id
      WHERE r.active = '0'
      AND 1=1
    `

    const request = pool.request()

    if (hotel_name) {
      query += ` AND h.hotel_name LIKE @hotel_name`
      request.input('hotel_name', sql.VarChar, `%${hotel_name}%`)
    }

    if (floor_name) {
      query += ` AND f.floor_name LIKE @floor_name`
      request.input('floor_name', sql.VarChar, `%${floor_name}%`)
    }

    if (room_no) {
      query += ` AND r.room_no LIKE @room_no`
      request.input('room_no', sql.VarChar, `%${room_no}%`)
    }

    if (room_type) {
      query += ` AND r.room_type LIKE @room_type`
      request.input('room_type', sql.VarChar, `%${room_type}%`)
    }

    if (status) {
      query += ` AND r.status = @status`
      request.input('status', sql.VarChar, status)
    }

    console.log('FINAL QUERY:', query) // 👈 debug

    const result = await request.query(query)

    return res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log('SEARCH ERROR:', error) // 👈 MUST CHECK THIS
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRoomStats = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        COUNT(*) AS totalRooms,
        SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END) AS occupiedRooms,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS availableRooms
      FROM room_masters
      WHERE active = '0'
    `)

    return res.json({
      success: true,
      data: result.recordset[0],
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getAvailableRooms = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
        r.*,
        h.hotel_name,
        f.floor_name
      FROM room_masters r
      LEFT JOIN hotel h ON r.hotel_id = h.id
      LEFT JOIN floor_master f ON r.floor_id = f.floor_id
      WHERE r.active = '0'
      AND LOWER(r.status) = 'available'
      ORDER BY r.room_id DESC
    `)

    return res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getDeletedRooms = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT
        r.*,
        h.hotel_name,
        f.floor_name
      FROM room_masters r
      LEFT JOIN hotel h ON r.hotel_id = h.id
      LEFT JOIN floor_master f ON r.floor_id = f.floor_id
      WHERE r.active = '1'
      ORDER BY r.room_id DESC
    `)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.restoreRoom = async (req, res) => {
  try {
    const pool = await poolPromise

    await pool.request().input('roomId', sql.Int, req.params.roomId).query(`
        UPDATE room_masters
        SET active='0',
            updated_on=GETDATE()
        WHERE room_id=@roomId
      `)

    res.json({
      success: true,
      message: 'Room restored successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
