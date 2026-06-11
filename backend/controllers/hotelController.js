const XLSX = require('xlsx')
const HotelModel = require('../models/hotelModels')

exports.createHotel = async (req, res) => {
  try {
    await HotelModel.createHotel(req.body, req.files, req.user.id)

    return res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.getHotels = async (req, res) => {
  try {
    const { status, searchFields, fromDate, toDate } = req.query
    const { hotels, counts } = await HotelModel.getHotels(status, searchFields, fromDate, toDate)

    return res.status(200).json({
      success: true,
      data: hotels,
      counts,
    })
  } catch (error) {
    console.log('getHotels error:', error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.getHotelById = async (req, res) => {
  try {
    const hotel = await HotelModel.getHotelById(req.params.id)

    return res.status(200).json({
      success: true,
      data: hotel,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.updateHotel = async (req, res) => {
  try {
    const updated = await HotelModel.updateHotel(req.params.id, req.body, req.files, req.user.id)

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
    })
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.deleteHotel = async (req, res) => {
  try {
    const deleted = await HotelModel.deleteHotel(req.params.id, req.user.id)

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Hotel moved to trash (soft deleted)',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.exportHotels = async (req, res) => {
  try {
    const { searchFields, fromDate, toDate } = req.query
    const hotels = await HotelModel.exportHotels(searchFields, fromDate, toDate)

    const worksheet = XLSX.utils.json_to_sheet(hotels)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hotels')

    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    console.log('Export API Hit.')

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=Hotels.xlsx')

    return res.send(excelBuffer)
  } catch (error) {
    console.log(error)

    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}

exports.restoreHotel = async (req, res) => {
  try {
    await HotelModel.restoreHotel(req.params.id, req.user.id)

    return res.status(200).json({
      success: true,
      message: 'Hotel restored successfully',
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    })
  }
}
