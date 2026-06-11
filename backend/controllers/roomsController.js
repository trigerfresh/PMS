const XLSX = require('xlsx')
const RoomModel = require('../models/roomsModels')

exports.createRoom = async (req, res) => {
  try {
    const data = await RoomModel.createRoom(req.body, req.files)

    return res.json({
      success: true,
      message: 'Room created successfully',
      data,
    })
  } catch (error) {
    console.log(error)
    return res.status(
      error.message.includes('already created') || error.message.includes('not found') ? 400 : 500
    ).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRooms = async (req, res) => {
  try {
    const data = await RoomModel.getRooms()

    return res.json({
      success: true,
      data,
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
    const data = await RoomModel.getRoomById(req.params.id)

    return res.json({
      success: true,
      data,
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
    await RoomModel.updateRoom(req.params.roomId, req.body, req.files)

    return res.json({
      success: true,
      message: 'Room updated successfully',
    })
  } catch (error) {
    return res.status(
      error.message.includes('not found') || error.message.includes('already created') ? 400 : 500
    ).json({
      success: false,
      message: error.message,
    })
  }
}

exports.deleteRoom = async (req, res) => {
  try {
    await RoomModel.deleteRoom(req.params.roomId)

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
    const data = await RoomModel.getRoomsByFloor(req.params.floorId)

    res.json({
      data,
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
    const data = await RoomModel.searchRooms(req.query)

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.log('SEARCH ERROR:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

exports.getRoomStats = async (req, res) => {
  try {
    const data = await RoomModel.getRoomStats()

    return res.json({
      success: true,
      data,
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
    const data = await RoomModel.getAvailableRooms()

    return res.json({
      success: true,
      data,
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
    const data = await RoomModel.getDeletedRooms()

    res.json({
      success: true,
      data,
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
    await RoomModel.restoreRoom(req.params.roomId)

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

exports.exportRooms = async (req, res) => {
  try {
    const rows = await RoomModel.exportRooms(req.query.searchFields)

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: 'No data to export' })
    }

    // Clean up room_amenities JSON arrays for display in Excel
    rows.forEach((row) => {
      if (row.Amenities) {
        try {
          const parsed = JSON.parse(row.Amenities)
          if (Array.isArray(parsed)) {
            row.Amenities = parsed.join(', ')
          }
        } catch (e) {
          // Keep it as is
        }
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rooms')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=Rooms.xlsx')

    return res.send(excelBuffer)
  } catch (error) {
    console.error('Export Rooms Error:', error)
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}
