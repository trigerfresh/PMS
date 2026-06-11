const { poolPromise, sql } = require('../config/db')

class PrimaryCategoryModel {
  static async createPrimaryCategory(primary_categories_name, image) {
    const pool = await poolPromise
    await pool
      .request()
      .input('name', sql.NVarChar, primary_categories_name)
      .input('image', sql.NVarChar, image).query(`
        INSERT INTO primary_categories
        (
          primary_categories_name,
          image,
          active,
          created_on
        )
        VALUES
        (
          @name,
          @image,
          '0',
          GETDATE()
        )
      `)
  }

  static async getPrimaryCategories() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT id, primary_categories_name, image, active
      FROM primary_categories
      ORDER BY id ASC
    `)
    return result.recordset
  }

  static async updatePrimaryCategory(id, primary_categories_name, image) {
    const pool = await poolPromise
    let query = `
      UPDATE primary_categories
      SET primary_categories_name = @name,
          modified_on = GETDATE()
    `
    if (image) {
      query += `, image = @image`
    }
    query += ` WHERE id = @id`

    const request = pool
      .request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, primary_categories_name)

    if (image) {
      request.input('image', sql.NVarChar, image)
    }

    await request.query(query)
  }

  static async deletePrimaryCategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE primary_categories
        SET active = '1',
            disabled_on = GETDATE()
        WHERE id = @id
      `)
  }

  static async restorePrimaryCategory(id) {
    const pool = await poolPromise
    await pool.request().input('id', sql.Int, id).query(`
        UPDATE primary_categories
        SET active = '0',
            modified_on = GETDATE()
        WHERE id = @id
      `)
  }

  static async searchPrimaryCategories(primary_categories_name) {
    const pool = await poolPromise
    let query = `
      SELECT
        id,
        primary_categories_name,
        active
      FROM primary_categories
      WHERE 1=1
    `
    const request = pool.request()

    if (primary_categories_name) {
      query += ` AND primary_categories_name LIKE @name`
      request.input('name', sql.NVarChar, '%' + primary_categories_name + '%')
    }

    query += ` ORDER BY id DESC`

    const result = await request.query(query)
    return result.recordset
  }

  static async exportExcel() {
    const pool = await poolPromise
    const result = await pool.request().query(`
      SELECT id, primary_categories_name, active, created_on
      FROM primary_categories
      ORDER BY id DESC
    `)
    return result.recordset
  }
}

module.exports = PrimaryCategoryModel
