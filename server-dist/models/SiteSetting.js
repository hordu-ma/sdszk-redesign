// SiteSetting.js - 网站设置模型
import mongoose from 'mongoose'

const siteSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    group: {
      type: String,
      required: true,
      trim: true,
      default: 'general',
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'number', 'boolean', 'json', 'array', 'image', 'color'],
      default: 'text',
    },
    isProtected: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
)

// 创建复合索引
siteSettingSchema.index({ key: 1, group: 1 }, { unique: true })

// 查找设置的静态方法
siteSettingSchema.statics.getByKey = async function (key) {
  const setting = await this.findOne({ key })
  return setting ? setting.value : null
}

// 批量获取设置的静态方法
siteSettingSchema.statics.getByGroup = async function (group) {
  const settings = await this.find({ group })
  return settings.reduce((result, setting) => {
    result[setting.key] = setting.value
    return result
  }, {})
}

// 保存或更新设置的静态方法
siteSettingSchema.statics.setByKey = async function (
  key,
  value,
  userId,
  description = '',
  group = 'general',
  type = 'text'
) {
  return await this.findOneAndUpdate(
    { key },
    {
      $set: {
        value,
        description,
        group,
        type,
        updatedBy: userId,
      },
    },
    { new: true, upsert: true, runValidators: true }
  )
}

const SiteSetting = mongoose.model('SiteSetting', siteSettingSchema)

// 添加默认设置初始化方法
SiteSetting.initializeDefaultSettings = async function () {
  const defaultSettings = [
    {
      key: 'siteName',
      value: '山东省大中小学思政课一体化指导中心',
      description: '网站名称',
      group: 'general',
      type: 'text',
    },
    {
      key: 'siteDescription',
      value: '山东省大中小学思政课一体化指导中心官方网站',
      description: '网站描述',
      group: 'general',
      type: 'text',
    },
    {
      key: 'contactEmail',
      value: 'contact@sdszk.edu.cn',
      description: '联系邮箱',
      group: 'contact',
      type: 'text',
    },
    {
      key: 'contactPhone',
      value: '',
      description: '联系电话',
      group: 'contact',
      type: 'text',
    },
    {
      key: 'address',
      value: '山东省济南市',
      description: '中心地址',
      group: 'contact',
      type: 'text',
    },
    {
      key: 'logoUrl',
      value: '/assets/images/logo.png',
      description: '网站Logo',
      group: 'appearance',
      type: 'image',
    },
    {
      key: 'primaryColor',
      value: '#9a2314',
      description: '主题色',
      group: 'appearance',
      type: 'color',
    },
    {
      key: 'homeBanners',
      value: [
        {
          imageUrl: '/assets/images/banner.jpg',
          title: '思政教育',
          link: '#',
          order: 1,
        },
      ],
      description: '首页轮播图配置',
      group: 'homepage',
      type: 'json',
    },
    {
      key: 'icp',
      value: '鲁ICP备XXXXXXXX号',
      description: 'ICP备案号',
      group: 'footer',
      type: 'text',
    },
    {
      key: 'copyright',
      value: '© 2024 山东省大中小学思政课一体化指导中心. 版权所有',
      description: '版权信息',
      group: 'footer',
      type: 'text',
    },
  ]

  for (const setting of defaultSettings) {
    const exists = await SiteSetting.findOne({ key: setting.key })
    if (!exists) {
      await SiteSetting.create(setting)
    }
  }
}

export default SiteSetting
