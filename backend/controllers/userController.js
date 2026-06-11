const UserModel = require('../models/userModels')

exports.createUser = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const profile_image = req.file ? req.file.filename : null

    await UserModel.createUser(req.body, profile_image)

    return res.json({
      success: true,
      message: 'User created successfully',
    })
  } catch (err) {
    console.error('CREATE USER ERROR:', err)
    return res.status(
      err.message === 'A user with this email address already exists' ? 400 : 500
    ).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getUsers = async (req, res) => {
  try {
    const data = await UserModel.getUsers()
    res.json(data)
  } catch (err) {
    console.error('GET USERS ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

exports.getUserById = async (req, res) => {
  try {
    const data = await UserModel.getUserById(req.params.id)
    res.json(data)
  } catch (err) {
    console.error('GET USER ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

exports.updateUser = async (req, res) => {
  try {
    const profile_image = req.file ? req.file.filename : null
    await UserModel.updateUser(req.params.id, req.body, profile_image)

    res.json({
      success: true,
      message: 'User updated successfully',
    })
  } catch (err) {
    console.error('UPDATE USER ERROR:', err)
    res.status(err.message === 'User not found' ? 404 : 500).json({ message: err.message })
  }
}

exports.deleteUser = async (req, res) => {
  try {
    await UserModel.deleteUser(req.params.id)
    res.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (err) {
    console.error('DELETE USER ERROR:', err)
    res.status(500).json({ message: err.message })
  }
}

exports.getDeletedUsers = async (req, res) => {
  try {
    const data = await UserModel.getDeletedUsers()
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.restoreUser = async (req, res) => {
  try {
    await UserModel.restoreUser(req.params.id)
    res.json({
      success: true,
      message: 'User restored successfully',
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

exports.getUsersSearch = async (req, res) => {
  try {
    const data = await UserModel.getUsersSearch(req.query)
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.error('GET USERS ERROR:', err)
    res.status(500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.getProfile = async (req, res) => {
  try {
    const data = await UserModel.getProfile(req.user.id)
    res.json({
      success: true,
      data,
    })
  } catch (err) {
    console.log(err)
    res.status(err.message === 'Profile not found' ? 404 : 500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const profile_image = req.file ? req.file.filename : null
    await UserModel.updateProfile(req.user.id, req.body, profile_image)

    res.json({
      success: true,
      message: 'Profile updated successfully',
    })
  } catch (err) {
    console.log(err)
    res.status(err.message === 'User not found' ? 404 : 500).json({
      success: false,
      message: err.message,
    })
  }
}

exports.exportUsersExcel = async (req, res) => {
  try {
    const excelBuffer = await UserModel.exportUsersExcel(req.query)

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx')
    res.send(excelBuffer)
  } catch (err) {
    console.error('EXCEL EXPORT ERROR:', err)
    res.status(500).json({ message: 'Excel download error' })
  }
}
