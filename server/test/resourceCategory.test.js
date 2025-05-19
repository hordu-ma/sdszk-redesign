import mongoose from 'mongoose'
import { expect } from 'chai'
import ResourceCategory from '../models/ResourceCategory.js'

describe('资源分类模型测试', () => {
  before(async () => {
    // 连接测试数据库
    await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/sdszk_test')
  })

  after(async () => {
    // 断开数据库连接
    await mongoose.connection.close()
  })

  beforeEach(async () => {
    // 清理测试数据
    await ResourceCategory.deleteMany({})
  })

  it('应该成功创建资源分类', async () => {
    const categoryData = {
      name: '测试分类',
      description: '这是一个测试分类',
      order: 1,
      isActive: true,
    }

    const category = new ResourceCategory(categoryData)
    const savedCategory = await category.save()

    expect(savedCategory.name).to.equal(categoryData.name)
    expect(savedCategory.description).to.equal(categoryData.description)
    expect(savedCategory.order).to.equal(categoryData.order)
    expect(savedCategory.isActive).to.equal(categoryData.isActive)
  })

  it('没有名称时应该验证失败', async () => {
    const category = new ResourceCategory({
      description: '这是一个测试分类',
      order: 1,
    })

    try {
      await category.save()
      expect.fail('应该因为缺少名称而失败')
    } catch (error) {
      expect(error).to.be.an('error')
      expect(error.errors.name).to.exist
    }
  })

  it('应该成功更新资源分类', async () => {
    const category = await ResourceCategory.create({
      name: '原始分类',
      description: '原始描述',
      order: 1,
      isActive: true,
    })

    const updatedData = {
      name: '更新后的分类',
      description: '更新后的描述',
    }

    const updatedCategory = await ResourceCategory.findByIdAndUpdate(category._id, updatedData, {
      new: true,
    })

    expect(updatedCategory.name).to.equal(updatedData.name)
    expect(updatedCategory.description).to.equal(updatedData.description)
  })

  it('应该成功软删除资源分类', async () => {
    const category = await ResourceCategory.create({
      name: '测试分类',
      description: '测试描述',
      order: 1,
      isActive: true,
    })

    await ResourceCategory.findByIdAndUpdate(category._id, { isDeleted: true })
    const deletedCategory = await ResourceCategory.findById(category._id)

    expect(deletedCategory.isDeleted).to.be.true
  })

  it('应该按照顺序获取资源分类列表', async () => {
    await ResourceCategory.create([
      { name: '分类1', order: 2, isActive: true },
      { name: '分类2', order: 1, isActive: true },
      { name: '分类3', order: 3, isActive: true },
    ])

    const categories = await ResourceCategory.find({ isDeleted: false }).sort({ order: 1 })

    expect(categories).to.have.lengthOf(3)
    expect(categories[0].name).to.equal('分类2')
    expect(categories[1].name).to.equal('分类1')
    expect(categories[2].name).to.equal('分类3')
  })
})
