// siteSettingController.js - 站点设置控制器
import SiteSetting from '../models/SiteSetting.js'
import ActivityLog from '../models/ActivityLog.js'

// 获取所有设置
export const getAllSettings = async (req, res) => {
  try {
    const settings = await SiteSetting.find().sort({ group: 1, key: 1 })

    // 将设置按组分类
    const groupedSettings = settings.reduce((result, setting) => {
      if (!result[setting.group]) {
        result[setting.group] = []
      }
      result[setting.group].push(setting)
      return result
    }, {})

    res.json({
      status: 'success',
      data: groupedSettings,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取按组分类的设置
export const getSettingsByGroup = async (req, res) => {
  try {
    const { group } = req.params

    const settings = await SiteSetting.find({ group }).sort({ key: 1 })

    res.json({
      status: 'success',
      data: settings,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取单个设置
export const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params

    const setting = await SiteSetting.findOne({ key })

    if (!setting) {
      return res.status(404).json({
        status: 'fail',
        message: '设置不存在',
      })
    }

    res.json({
      status: 'success',
      data: setting,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 更新设置
export const updateSetting = async (req, res) => {
  try {
    const { key } = req.params
    const { value, description, group, type } = req.body

    // 检查受保护的设置
    const existingSetting = await SiteSetting.findOne({ key })
    if (existingSetting && existingSetting.isProtected && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'fail',
        message: '此设置受保护，只有管理员可以修改',
      })
    }

    const setting = await SiteSetting.findOneAndUpdate(
      { key },
      {
        value,
        description: description || existingSetting?.description,
        group: group || existingSetting?.group,
        type: type || existingSetting?.type,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true }
    )

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'settings_update',
      entityType: 'setting',
      entityId: setting._id,
      details: {
        key: setting.key,
        group: setting.group,
        oldValue: existingSetting?.value,
        newValue: setting.value,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      data: setting,
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 批量更新设置
export const bulkUpdateSettings = async (req, res) => {
  try {
    const { settings } = req.body

    if (!Array.isArray(settings)) {
      return res.status(400).json({
        status: 'fail',
        message: '请提供设置数组',
      })
    }

    const results = []

    for (const setting of settings) {
      const { key, value, description, group, type } = setting

      // 检查受保护的设置
      const existingSetting = await SiteSetting.findOne({ key })
      if (existingSetting && existingSetting.isProtected && req.user.role !== 'admin') {
        results.push({
          key,
          success: false,
          message: '此设置受保护，只有管理员可以修改',
        })
        continue
      }

      const updatedSetting = await SiteSetting.findOneAndUpdate(
        { key },
        {
          value,
          description: description || existingSetting?.description,
          group: group || existingSetting?.group,
          type: type || existingSetting?.type,
          updatedBy: req.user._id,
        },
        { new: true, upsert: true, runValidators: true }
      )

      // 记录活动
      await ActivityLog.logActivity({
        userId: req.user._id,
        username: req.user.username,
        action: 'settings_update',
        entityType: 'setting',
        entityId: updatedSetting._id,
        details: {
          key: updatedSetting.key,
          group: updatedSetting.group,
          oldValue: existingSetting?.value,
          newValue: updatedSetting.value,
        },
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      })

      results.push({
        key,
        success: true,
        data: updatedSetting,
      })
    }

    res.json({
      status: 'success',
      results,
    })
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message,
    })
  }
}

// 删除设置
export const deleteSetting = async (req, res) => {
  try {
    const { key } = req.params

    // 检查受保护的设置
    const existingSetting = await SiteSetting.findOne({ key })
    if (!existingSetting) {
      return res.status(404).json({
        status: 'fail',
        message: '设置不存在',
      })
    }

    if (existingSetting.isProtected) {
      return res.status(403).json({
        status: 'fail',
        message: '此设置受保护，不可删除',
      })
    }

    await SiteSetting.deleteOne({ key })

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'delete',
      entityType: 'setting',
      entityId: existingSetting._id,
      details: {
        key: existingSetting.key,
        group: existingSetting.group,
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: '设置已删除',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 重置为默认设置
export const resetToDefault = async (req, res) => {
  try {
    await SiteSetting.initializeDefaultSettings()

    // 记录活动
    await ActivityLog.logActivity({
      userId: req.user._id,
      username: req.user.username,
      action: 'settings_update',
      entityType: 'system',
      details: {
        action: 'reset_settings',
      },
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })

    res.json({
      status: 'success',
      message: '设置已重置为默认值',
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}

// 获取前端公开设置
export const getPublicSettings = async (req, res) => {
  try {
    // 定义前端可用的公开设置组
    const publicGroups = ['general', 'appearance', 'homepage', 'footer', 'contact']

    const settings = await SiteSetting.find({
      group: { $in: publicGroups },
    })

    // 将设置转换为键值对格式
    const publicSettings = settings.reduce((result, setting) => {
      result[setting.key] = setting.value
      return result
    }, {})

    res.json({
      status: 'success',
      data: publicSettings,
    })
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: err.message,
    })
  }
}
