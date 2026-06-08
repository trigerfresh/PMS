const express = require('express')
const router = express.Router()

const { poolPromise, sql } = require('../config/db')

const floorController = require('../controllers/floorController')

router.post('/floor', floorController.createFloor)
router.get('/floors/:hotel_id', floorController.getFloorsByHotel)
router.put('/floor/:id', floorController.updateFloor)
router.delete('/floor/:id', floorController.deleteFloor)
router.put('/floor/restore/:id', floorController.restoreFloor)
router.get('/floors', async (req, res) => {
  try {
    const pool = await poolPromise

    const result = await pool.request().query(`
      SELECT *
      FROM floor_master
      WHERE active = '0'
      ORDER BY floor_number
    `)

    res.json({
      data: result.recordset,
    })
  } catch (err) {
    res.status(500).json({
      message: err.message,
    })
  }
})
//search
// router.get('/hotel/:hotel_id', floorController.getFloorsByHotel)
// ================= ROOMS BY FLOOR =================
// router.get('/rooms/floor/:floorId', async (req, res) => {
//   try {
//     const pool = await poolPromise

//     const floorId = req.params.floorId

//     const result = await pool.request().input('floor_id', sql.Int, floorId)
//       .query(`
//         SELECT
//           room_id,
//           room_no,
//           room_type,
//           status
//         FROM room_masters
//         WHERE floor_id = @floor_id
//         AND active = '0'
//         AND LOWER(status) = 'available'
//         ORDER BY room_no ASC
//       `)

//     res.json({
//       data: result.recordset,
//     })
//   } catch (err) {
//     console.log(err)

//     res.status(500).json({
//       message: 'Error fetching rooms',
//     })
//   }
// })

router.get('/rooms/floor/:floorId', async (req, res) => {
  try {
    const pool = await poolPromise

    const floorId = req.params.floorId

    const result = await pool.request().input('floor_id', sql.Int, floorId)
      .query(`
        SELECT 
          room_id,
          room_no,
          room_type,
          status
        FROM room_masters
        WHERE floor_id = @floor_id
          AND active = '0'
        ORDER BY room_no ASC
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
})

module.exports = router
