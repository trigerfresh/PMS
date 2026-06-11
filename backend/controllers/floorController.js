const FloorModel = require('../models/floorModels')

exports.createFloor = async (req, res) => {
  try {
    await FloorModel.createFloor(req.body)
    res.json({ message: 'Floor created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getFloorsByHotel = async (req, res) => {
  try {
    const { hotel_id } = req.params
    const { searchFields, status } = req.query

    const data = await FloorModel.getFloorsByHotel(hotel_id, searchFields, status)
    res.json({ data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.updateFloor = async (req, res) => {
  try {
    await FloorModel.updateFloor(req.params.id, req.body)
    res.json({ message: 'Floor updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.deleteFloor = async (req, res) => {
  try {
    await FloorModel.deleteFloor(req.params.id)
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
    await FloorModel.restoreFloor(req.params.id)
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

exports.exportFloorsExcel = async (req, res) => {
  try {
    const { hotel_id } = req.params
    const buffer = await FloorModel.exportFloorsExcel(hotel_id)

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=floors_' + hotel_id + '.xlsx',
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
