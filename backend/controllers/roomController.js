const { poolPromise, sql } = require('../config/db')

exports.createRoom = async (req, res) => {
  try {
    const {
      hotel_id,
      hotel_name,
      room_no,
      room_type,
      price,
      capacity,
      amenities,
      description,
      status,
    } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('hotel_name', sql.VarChar, hotel_name)
      .input('room_no', sql.VarChar, room_no)
      .input('room_type', sql.VarChar, room_type)
      .input('price', sql.Decimal(10, 2), price)
      .input('capacity', sql.Int, capacity)
      .input('amenities', sql.VarChar, amenities)
      .input('description', sql.VarChar, description)
      .input('status', sql.VarChar, status)
      .input('created_by', sql.Int, req.user.id).query(`
        INSERT INTO room_master (
          hotel_id, hotel_name, room_no, room_type,
          price, capacity, amenities, description,status,
          active, created_by, created_on
        )
        VALUES (
          @hotel_id, @hotel_name, @room_no, @room_type,
          @price, @capacity, @amenities, @description, @status,
          '0', @created_by, GETDATE()
        )
      `)

    res.json({ success: true, message: 'Room created' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRooms = async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT 
    r.*,
    h.hotel_name
  FROM room_master r
  LEFT JOIN hotel h ON r.hotel_id = h.id
  WHERE r.active = '0'
    `)

    res.json({ data: result.recordset })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params

    const {
      hotel_id,
      hotel_name,
      room_no,
      room_type,
      price,
      capacity,
      amenities,
      description,
      status,
    } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('hotel_id', sql.Int, hotel_id)
      .input('hotel_name', sql.VarChar, hotel_name)
      .input('room_no', sql.VarChar, room_no)
      .input('room_type', sql.VarChar, room_type)
      .input('price', sql.Decimal(10, 2), price)
      .input('capacity', sql.Int, capacity)
      .input('amenities', sql.VarChar, amenities)
      .input('status', sql.VarChar, status)
      .input('description', sql.VarChar, description).query(`
        UPDATE room_master
        SET
          hotel_id = @hotel_id,
          hotel_name = @hotel_name,
          room_no = @room_no,
          room_type = @room_type,
          price = @price,
          capacity = @capacity,
          amenities = @amenities,
          status = @status,
          description = @description
        WHERE room_id = @id
      `)

    res.json({ message: 'Room updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params

    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
        UPDATE room_master
        SET active = 1
        WHERE room_id = @id
      `)

    res.json({ message: 'Room deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getRoomsByHotel = async (req, res) => {
  try {
    const pool = await poolPromise
    const { hotel_id } = req.params

    const result = await pool.request().input('hotel_id', sql.Int, hotel_id)
      .query(`
        SELECT *
        FROM room_master
        WHERE hotel_id = @hotel_id
          AND active = '0'
        
      `)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log('GET ROOMS BY HOTEL ERROR:', error)

    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getAvailableRooms = async (req, res) => {
  try {
    const pool = await poolPromise
    const { hotel_id } = req.params

    const result = await pool.request().input('hotel_id', sql.Int, hotel_id)
      .query(`
        SELECT *
        FROM room_master
        WHERE id = @id
           active = '0'
        ORDER BY room_no ASC
      `)

    res.json({
      success: true,
      data: result.recordset,
    })
  } catch (error) {
    console.log('GET AVAILABLE ROOMS ERROR:', error)

    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
