const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

exports.createFloor = async (req, res) => {
  try {
    const { hotel_id, floor_name, floor_number } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('hotel_id', sql.Int, hotel_id)
      .input('floor_name', sql.VarChar, floor_name)
      .input('floor_number', sql.Int, floor_number).query(`
        INSERT INTO floor_master
        (hotel_id, floor_name, floor_number, active, created_on)
        VALUES
        (@hotel_id, @floor_name, @floor_number, '0', GETDATE())
      `)

    res.json({ message: 'Floor created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getFloorsByHotel = async (req, res) => {
  try {
    const { hotel_id } = req.params
    const { searchFields } = req.query

    const pool = await poolPromise
    const request = pool.request()

    request.input('hotel_id', sql.Int, hotel_id)

    let query = `
      SELECT *
      FROM floor_master
      WHERE hotel_id = @hotel_id
        AND active = '0'
    `

    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const allowed = {
        floor_name: 'floor_name',
        floor_number: 'floor_number',
      }

      fields.forEach((item, i) => {
        const dbField = allowed[item.field]
        if (dbField && item.keyword) {
          query += ` AND ${dbField} LIKE @kw${i}`
          request.input(`kw${i}`, sql.VarChar, `%${item.keyword}%`)
        }
      })
    }

    query += ` ORDER BY floor_number`

    const result = await request.query(query)

    res.json({ data: result.recordset })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// exports.getFloorsByHotel = async (req, res) => {
//   try {
//     const { hotel_id } = req.params
//     const pool = await poolPromise

//     const result = await pool.request().input('hotel_id', sql.Int, hotel_id)
//       .query(`
//         SELECT *
//         FROM floor_master
//         WHERE hotel_id = @hotel_id
//           AND active = '0'
//         ORDER BY floor_number
//       `)

//     res.json({ data: result.recordset })
//   } catch (err) {
//     res.status(500).json({ message: err.message })
//   }
// }

exports.updateFloor = async (req, res) => {
  try {
    const { id } = req.params
    const { floor_name, floor_number } = req.body

    const pool = await poolPromise

    await pool
      .request()
      .input('id', sql.Int, id)
      .input('floor_name', sql.VarChar, floor_name)
      .input('floor_number', sql.Int, floor_number).query(`
        UPDATE floor_master
        SET 
          floor_name = @floor_name,
          floor_number = @floor_number,
          updated_on = GETDATE()
        WHERE floor_id = @id
      `)

    res.json({ message: 'Floor updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteFloor = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
        UPDATE floor_master
        SET 
          active = '1',
          updated_on = GETDATE()
        WHERE floor_id = @id
      `)

    res.json({
      success: true,
      message: 'Floor moved to trash successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.restoreFloor = async (req, res) => {
  try {
    const { id } = req.params
    const pool = await poolPromise

    await pool.request().input('id', sql.Int, id).query(`
        UPDATE floor_master
        SET 
          active = '0',
          updated_on = GETDATE()
        WHERE floor_id = @id 
      `)

    res.json({
      success: true,
      message: 'Floor restored successfully',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getFloorsByHotel = async (req, res) => {
  try {
    const { hotel_id } = req.params
    const { searchFields, status } = req.query

    const pool = await poolPromise
    const request = pool.request()

    request.input('hotel_id', sql.Int, hotel_id)

    let query = `
      SELECT *
      FROM floor_master
      WHERE hotel_id = @hotel_id
    `

    // ✅ ACTIVE / DELETED FILTER FIX
    if (status === '0') {
      query += ` AND active = '0'`
    } else if (status === '1') {
      query += ` AND active = '1'`
    }

    // SEARCH
    if (searchFields) {
      const fields = JSON.parse(searchFields)

      const allowed = {
        floor_name: 'floor_name',
        floor_number: 'floor_number',
      }

      fields.forEach((item, index) => {
        const dbField = allowed[item.field]

        if (dbField && item.keyword) {
          query += ` AND ${dbField} LIKE @kw${index}`
          request.input(`kw${index}`, sql.VarChar, `%${item.keyword}%`)
        }
      })
    }

    query += ` ORDER BY floor_number`

    const result = await request.query(query)

    res.json({ data: result.recordset })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.exportFloorsExcel = async (req, res) => {
  try {
    const { hotel_id } = req.params

    const pool = await poolPromise

    const result = await pool.request().input('hotel_id', sql.Int, hotel_id)
      .query(`
        SELECT 
          floor_number,
          floor_name
        FROM floor_master
        WHERE hotel_id = @hotel_id
          AND active = '0'
        ORDER BY floor_number
      `)

    const data = result.recordset

    // 👉 convert JSON to sheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Floors')

    // 👉 buffer create
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=floors_${hotel_id}.xlsx`,
    )

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )

    res.send(buffer)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
