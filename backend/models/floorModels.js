const { poolPromise, sql } = require('../config/db')
const XLSX = require('xlsx')

class FloorModel {
  static async createFloor(floorData) {
    const { hotel_id, floor_name, floor_number } = floorData
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
  }

  static async getFloorsByHotel(hotel_id, searchFields, status) {
    const pool = await poolPromise
    const request = pool.request()

    request.input('hotel_id', sql.Int, hotel_id)

    let query = `
      SELECT *
      FROM floor_master
      WHERE hotel_id = @hotel_id
    `

    if (status === '0') {
      query += " AND active = '0'"
    } else if (status === '1') {
      query += " AND active = '1'"
    }

    if (searchFields) {
      const fields = JSON.parse(searchFields)
      const allowed = {
        floor_name: 'floor_name',
        floor_number: 'floor_number',
      }

      fields.forEach((item, index) => {
        const dbField = allowed[item.field]
        if (dbField && item.keyword) {
          query += ' AND ' + dbField + ' LIKE @kw' + index
          request.input('kw' + index, sql.VarChar, '%' + item.keyword + '%')
        }
      })
    }

    query += " ORDER BY floor_number"

    const result = await request.query(query)
    return result.recordset
  }

  static async updateFloor(id, floorData) {
    const { floor_name, floor_number } = floorData
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
  }

  static async deleteFloor(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE floor_master
        SET 
          active = '1',
          updated_on = GETDATE()
        WHERE floor_id = @id
      `)
  }

  static async restoreFloor(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE floor_master
        SET 
          active = '0',
          updated_on = GETDATE()
        WHERE floor_id = @id 
      `)
  }

  static async exportFloorsExcel(hotel_id) {
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
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Floors')

    return XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    })
  }
}

module.exports = FloorModel
