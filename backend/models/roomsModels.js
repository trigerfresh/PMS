const { poolPromise, sql } = require('../config/db')

class RoomModel {
  static async createRoom(roomData, files) {
    const pool = await poolPromise
    const {
      hotel_id, floor_id, room_no, room_type, price, status,
      bhk, balcony, bedroom, kitchen, bathroom, bed_type,
      room_amenities, room_video_url,
    } = roomData

    const roomCheck = await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('floor_id', sql.Int, floor_id)
      .input('room_no', sql.VarChar, room_no)
      .query(`
        SELECT room_id FROM room_masters 
        WHERE hotel_id = @hotel_id AND floor_id = @floor_id AND room_no = @room_no AND active = '0'
      `)

    if (roomCheck.recordset.length > 0) {
      throw new Error('Room already created on this floor for the selected hotel')
    }

    const room_photo1 = files?.room_photo1?.[0]?.path || null
    const room_photo2 = files?.room_photo2?.[0]?.path || null
    const room_photo3 = files?.room_photo3?.[0]?.path || null
    const room_photo4 = files?.room_photo4?.[0]?.path || null

    const hotelResult = await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .query(`SELECT hotel_name FROM hotel WHERE id=@hotel_id`)

    if (!hotelResult.recordset.length) {
      throw new Error('Hotel not found')
    }
    const hotel_name = hotelResult.recordset[0].hotel_name

    const floorResult = await pool
      .request()
      .input('floor_id', sql.Int, floor_id)
      .query(`SELECT floor_name FROM floor_master WHERE floor_id=@floor_id`)

    if (!floorResult.recordset.length) {
      throw new Error('Floor not found')
    }
    const floor_name = floorResult.recordset[0].floor_name

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
      .input('room_video_url', sql.VarChar, room_video_url)
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

    return { hotel_name, floor_name }
  }

  static async getRooms() {
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
    return result.recordset
  }

  static async getRoomById(id) {
    const pool = await poolPromise
    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT * FROM room_masters
        WHERE room_id = @id
      `)
    return result.recordset[0] || null
  }

  static async updateRoom(roomId, roomData, files) {
    const pool = await poolPromise
    const {
      room_no, room_type, price, status, bhk, balcony, bedroom,
      kitchen, bathroom, bed_type, room_amenities, room_video_url
    } = roomData

    const existingRoom = await pool
      .request()
      .input('roomId', sql.Int, roomId)
      .query('SELECT hotel_id, floor_id, room_no FROM room_masters WHERE room_id = @roomId')

    if (!existingRoom.recordset.length) {
      throw new Error('Room not found')
    }

    const { hotel_id, floor_id, room_no: oldRoomNo } = existingRoom.recordset[0]

    if (room_no && room_no !== oldRoomNo) {
      const roomCheck = await pool
        .request()
        .input('hotel_id', sql.Int, hotel_id)
        .input('floor_id', sql.Int, floor_id)
        .input('room_no', sql.VarChar, room_no)
        .query(`
          SELECT room_id FROM room_masters 
          WHERE hotel_id = @hotel_id AND floor_id = @floor_id AND room_no = @room_no AND active = '0'
        `)

      if (roomCheck.recordset.length > 0) {
        throw new Error('Room already created on this floor for the selected hotel')
      }
    }

    const room_photo1 = files?.room_photo1?.[0]?.path
    const room_photo2 = files?.room_photo2?.[0]?.path
    const room_photo3 = files?.room_photo3?.[0]?.path
    const room_photo4 = files?.room_photo4?.[0]?.path

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
      .input('room_video_url', sql.VarChar, room_video_url)
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
  }

  static async deleteRoom(roomId) {
    const pool = await poolPromise
    await pool.request().input('roomId', sql.Int, roomId).query(`
        UPDATE room_masters
        SET active='1', updated_on=GETDATE()
        WHERE room_id=@roomId
      `)
  }

  static async getRoomsByFloor(floorId) {
    const pool = await poolPromise
    const result = await pool
      .request()
      .input('floor_id', sql.Int, floorId).query(`
        SELECT *
        FROM room_masters
        WHERE floor_id = @floor_id
        AND active = '0'
      `)
    return result.recordset
  }

  static async searchRooms(queryData) {
    const pool = await poolPromise
    const { hotel_name, floor_name, room_no, room_type, status } = queryData

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
      query += ' AND h.hotel_name LIKE @hotel_name'
      request.input('hotel_name', sql.VarChar, '%' + hotel_name + '%')
    }

    if (floor_name) {
      query += ' AND f.floor_name LIKE @floor_name'
      request.input('floor_name', sql.VarChar, '%' + floor_name + '%')
    }

    if (room_no) {
      query += ' AND r.room_no LIKE @room_no'
      request.input('room_no', sql.VarChar, '%' + room_no + '%')
    }

    if (room_type) {
      query += ' AND r.room_type LIKE @room_type'
      request.input('room_type', sql.VarChar, '%' + room_type + '%')
    }

    if (status) {
      query += ' AND r.status = @status'
      request.input('status', sql.VarChar, status)
    }

    const result = await request.query(query)
    return result.recordset
  }

  static async getRoomStats() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT 
        COUNT(*) AS totalRooms,
        SUM(CASE WHEN LOWER(status) = 'occupied' THEN 1 ELSE 0 END) AS occupiedRooms,
        SUM(CASE WHEN LOWER(status) = 'available' THEN 1 ELSE 0 END) AS availableRooms,
        SUM(CASE WHEN LOWER(status) = 'maintenance' THEN 1 ELSE 0 END) AS maintenanceRooms
      FROM room_masters
      WHERE active = '0'
    `)
    return result.recordset[0]
  }

  static async getAvailableRooms() {
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
    return result.recordset
  }

  static async getDeletedRooms() {
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
    return result.recordset
  }

  static async restoreRoom(roomId) {
    const pool = await poolPromise
    await pool.request().input('roomId', sql.Int, roomId).query(`
        UPDATE room_masters
        SET active='0',
            updated_on=GETDATE()
        WHERE room_id=@roomId
      `)
  }

  static async exportRooms(searchFields) {
    const pool = await poolPromise
    let query = `
      SELECT 
        h.hotel_name AS [Hotel Name],
        f.floor_name AS [Floor Name],
        r.room_no AS [Room No],
        r.room_type AS [Room Type],
        r.price AS [Price],
        r.status AS [Status],
        r.bhk AS [BHK],
        r.balcony AS [Balcony],
        r.bedroom AS [Bedroom],
        r.bathroom AS [Bathroom],
        r.bed_type AS [Bed Type],
        r.room_amenities AS [Amenities]
      FROM room_masters r
      LEFT JOIN hotel h ON r.hotel_id = h.id
      LEFT JOIN floor_master f ON r.floor_id = f.floor_id
      WHERE r.active = '0'
    `

    const request = pool.request()

    if (searchFields) {
      const parsedFields = JSON.parse(searchFields)
      parsedFields.forEach((item, index) => {
        const keyword = item.keyword?.trim()
        const field = item.field
        const paramName = 'keyword' + index

        if (keyword) {
          if (field === 'hotel_name') {
            query += ' AND h.hotel_name LIKE @' + paramName
            request.input(paramName, sql.VarChar, '%' + keyword + '%')
          } else if (field === 'floor_name') {
            query += ' AND f.floor_name LIKE @' + paramName
            request.input(paramName, sql.VarChar, '%' + keyword + '%')
          } else if (field === 'room_no') {
            query += ' AND r.room_no LIKE @' + paramName
            request.input(paramName, sql.VarChar, '%' + keyword + '%')
          } else if (field === 'room_type') {
            query += ' AND r.room_type LIKE @' + paramName
            request.input(paramName, sql.VarChar, '%' + keyword + '%')
          } else if (field === 'status') {
            query += ' AND r.status = @' + paramName
            request.input(paramName, sql.VarChar, keyword)
          }
        }
      })
    }

    query += ' ORDER BY r.room_id DESC'

    const result = await request.query(query)
    return result.recordset
  }
}

module.exports = RoomModel
