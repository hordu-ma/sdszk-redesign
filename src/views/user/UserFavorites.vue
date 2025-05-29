<template>
  <div class="user-favorites">
    <!-- 操作栏 -->
    <div class="favorites-header">
      <div class="header-left">
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          clearable
          @change="handleCategoryChange"
          style="width: 150px; margin-right: 10px"
        >
          <el-option
            v-for="category in categories"
            :key="category.value"
            :label="category.label"
            :value="category.value"
          />
        </el-select>

        <el-select
          v-model="selectedType"
          placeholder="内容类型"
          clearable
          @change="loadFavorites"
          style="width: 120px; margin-right: 10px"
        >
          <el-option label="全部" value="" />
          <el-option label="新闻资讯" value="news" />
          <el-option label="资源文件" value="resource" />
          <el-option label="活动" value="activity" />
        </el-select>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索收藏内容"
          @keyup.enter="loadFavorites"
          style="width: 200px; margin-right: 10px"
        >
          <template #suffix>
            <el-icon @click="loadFavorites" style="cursor: pointer">
              <Search />
            </el-icon>
          </template>
        </el-input>
      </div>

      <div class="header-right">
        <el-button
          v-if="selectedItems.length > 0"
          type="danger"
          plain
          @click="batchDelete"
          :loading="loading"
        >
          批量删除 ({{ selectedItems.length }})
        </el-button>

        <el-button type="primary" @click="showCategoryDialog = true"> 管理分类 </el-button>
      </div>
    </div>

    <!-- 收藏统计 -->
    <div class="favorites-stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.total || 0 }}</div>
            <div class="stat-label">总收藏</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.news || 0 }}</div>
            <div class="stat-label">新闻资讯</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.resources || 0 }}</div>
            <div class="stat-label">资源文件</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-number">{{ stats.activities || 0 }}</div>
            <div class="stat-label">活动</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 收藏列表 -->
    <div class="favorites-list">
      <el-checkbox v-model="selectAll" @change="handleSelectAll" class="select-all-checkbox">
        全选
      </el-checkbox>

      <div v-if="loading && !favorites.length" class="loading-wrapper">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="!favorites.length" class="empty-state">
        <el-empty description="暂无收藏内容">
          <el-button type="primary" @click="$router.push('/')"> 去首页逛逛 </el-button>
        </el-empty>
      </div>

      <div v-else class="favorites-grid">
        <div
          v-for="item in favorites"
          :key="item._id"
          class="favorite-item"
          :class="{ selected: selectedItems.includes(item._id) }"
        >
          <el-checkbox
            :model-value="selectedItems.includes(item._id)"
            @change="checked => handleItemSelect(item._id, checked)"
            class="item-checkbox"
          />

          <div class="item-content" @click="openResource(item)">
            <div class="item-image">
              <img
                v-if="item.itemId.image"
                :src="item.itemId.image"
                :alt="item.itemId.title"
                @error="handleImageError"
              />
              <div v-else class="default-image">
                <i :class="getTypeIcon(item.itemType)"></i>
              </div>
            </div>

            <div class="item-info">
              <h3 class="item-title">{{ item.itemId.title }}</h3>
              <p v-if="item.itemId.description" class="item-description">
                {{ item.itemId.description }}
              </p>

              <div class="item-meta">
                <el-tag :type="getTypeColor(item.itemType)" size="small" class="type-tag">
                  {{ getTypeText(item.itemType) }}
                </el-tag>

                <el-tag v-if="item.category" size="small" plain class="category-tag">
                  {{ item.category }}
                </el-tag>

                <span class="collect-time">
                  {{ formatDate(item.createdAt) }}
                </span>
              </div>

              <div v-if="item.tags && item.tags.length" class="item-tags">
                <el-tag
                  v-for="tag in item.tags.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                  plain
                  class="tag-item"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="item.tags.length > 3" class="more-tags">
                  +{{ item.tags.length - 3 }}
                </span>
              </div>

              <p v-if="item.notes" class="item-notes">
                <i class="fas fa-sticky-note"></i>
                {{ item.notes }}
              </p>
            </div>
          </div>

          <div class="item-actions">
            <el-button type="text" size="small" @click="editFavorite(item)">
              <i class="fas fa-edit"></i>
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="deleteFavorite(item._id)"
              class="delete-btn"
            >
              <i class="fas fa-trash"></i>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[12, 24, 36, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadFavorites"
          @current-change="loadFavorites"
        />
      </div>
    </div>

    <!-- 分类管理对话框 -->
    <el-dialog v-model="showCategoryDialog" title="管理收藏分类" width="500px">
      <div class="category-manager">
        <el-form @submit.prevent="addCategory">
          <el-form-item>
            <el-input v-model="newCategoryName" placeholder="输入新分类名称" maxlength="20">
              <template #append>
                <el-button type="primary" @click="addCategory" :disabled="!newCategoryName.trim()">
                  添加
                </el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>

        <div class="category-list">
          <div v-for="category in userCategories" :key="category" class="category-item">
            <span>{{ category }}</span>
            <el-button
              type="text"
              size="small"
              @click="deleteCategory(category)"
              class="delete-category-btn"
            >
              <i class="fas fa-times"></i>
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑收藏对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑收藏" width="600px">
      <el-form v-if="editingItem" :model="editForm" label-width="80px">
        <el-form-item label="分类">
          <el-select
            v-model="editForm.category"
            placeholder="选择分类"
            allow-create
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="category in userCategories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            placeholder="添加标签"
            style="width: 100%"
          >
            <el-option v-for="tag in commonTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="editForm.notes"
            type="textarea"
            :rows="3"
            placeholder="添加备注信息"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="updateFavorite" :loading="loading"> 确定 </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import {
  getFavorites,
  deleteFavorite as deleteFavoriteApi,
  batchDeleteFavorites,
  updateFavorite as updateFavoriteApi,
  getFavoriteStats,
  getCategories,
  createCategory,
  deleteCategory as deleteCategoryApi,
} from '@/services/favorite.service'

// 响应式数据
// 定义收藏项接口
interface Favorite {
  _id: string
  user: string
  itemType: 'news' | 'resource'
  itemId: {
    _id: string
    title: string
    description?: string
    image?: string
    status: string
    createdAt: string
  }
  category: string
  tags: string[]
  notes?: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

// 定义统计数据接口
interface FavoriteStats {
  total: number
  news: number
  resources: number
  activities: number
}

const loading = ref(false)
const favorites = ref<Favorite[]>([])
const stats = ref<FavoriteStats>({
  total: 0,
  news: 0,
  resources: 0,
  activities: 0
})
const selectedItems = ref<string[]>([])
const selectAll = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

// 筛选条件
const selectedCategory = ref('')
const selectedType = ref('')
const searchKeyword = ref('')

// 分类管理
const showCategoryDialog = ref(false)
const userCategories = ref<string[]>([])
const newCategoryName = ref('')

// 编辑收藏
const showEditDialog = ref(false)
const editingItem = ref<Favorite | null>(null)
const editForm = reactive({
  category: '',
  tags: [] as string[],
  notes: '',
})

// 常用标签
const commonTags = ref<string[]>(['重要', '学习', '参考', '收藏', '推荐', '实用', '有趣'])

// 计算属性
const categories = computed(() => [
  { label: '全部', value: '' },
  ...userCategories.value.map(cat => ({ label: cat, value: cat })),
])

// 加载收藏列表
const loadFavorites = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      category: selectedCategory.value,
      resourceType: selectedType.value,
      keyword: searchKeyword.value,
    }

    const response = await getFavorites(params)
    favorites.value = response.data || []
    total.value = response.total || 0

    // 清空选择
    selectedItems.value = []
    selectAll.value = false
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '加载收藏失败'
    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    const response = await getFavoriteStats()
    stats.value = response.data || {}
  } catch (error) {
    console.error('加载统计失败:', error)
  }
}

// 加载用户分类
const loadCategories = async () => {
  try {
    const response = await getCategories()
    userCategories.value = response.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 处理分类变化
const handleCategoryChange = () => {
  currentPage.value = 1
  loadFavorites()
}

// 全选处理
const handleSelectAll = (checked: boolean | string | number) => {
  const isChecked = Boolean(checked)
  if (isChecked) {
    selectedItems.value = favorites.value.map(item => item._id)
  } else {
    selectedItems.value = []
  }
}

// 单项选择处理
const handleItemSelect = (id: string, checked: boolean | string | number) => {
  const isChecked = Boolean(checked)
  if (isChecked) {
    selectedItems.value.push(id)
  } else {
    const index = selectedItems.value.indexOf(id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

// 打开资源
const openResource = (item: any) => {
  // 根据类型构建URL
  let url = ''
  if (item.itemType === 'news') {
    url = `/news/${item.itemId._id}`
  } else if (item.itemType === 'resource') {
    url = `/resources/${item.itemId._id}`
  }
  
  if (url) {
    window.open(url, '_blank')
  }
}

// 删除单个收藏
const deleteFavorite = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个收藏吗？', '确认删除', {
      type: 'warning',
    })

    await deleteFavoriteApi(id)
    ElMessage.success('删除成功')
    loadFavorites()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// 批量删除
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedItems.value.length} 个收藏吗？`,
      '批量删除',
      { type: 'warning' }
    )

    loading.value = true
    await batchDeleteFavorites(selectedItems.value)
    ElMessage.success('批量删除成功')
    selectedItems.value = []
    selectAll.value = false
    loadFavorites()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '批量删除失败')
    }
  } finally {
    loading.value = false
  }
}

// 编辑收藏
const editFavorite = (item: any) => {
  editingItem.value = item
  editForm.category = item.category || ''
  editForm.tags = item.tags || []
  editForm.notes = item.notes || ''
  showEditDialog.value = true
}

// 更新收藏
const updateFavorite = async () => {
  if (!editingItem.value) return

  loading.value = true
  try {
    await updateFavoriteApi(editingItem.value._id, editForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    loadFavorites()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  } finally {
    loading.value = false
  }
}

// 添加分类
const addCategory = async () => {
  const name = newCategoryName.value.trim()
  if (!name) return

  try {
    await createCategory(name)
    ElMessage.success('分类添加成功')
    newCategoryName.value = ''
    loadCategories()
  } catch (error: any) {
    ElMessage.error(error.message || '添加分类失败')
  }
}

// 删除分类
const deleteCategory = async (category: string) => {
  try {
    await ElMessageBox.confirm(`确定要删除分类"${category}"吗？`, '确认删除', {
      type: 'warning',
    })

    await deleteCategoryApi(category)
    ElMessage.success('分类删除成功')
    loadCategories()
    if (selectedCategory.value === category) {
      selectedCategory.value = ''
      loadFavorites()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除分类失败')
    }
  }
}

// 获取类型图标
const getTypeIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    news: 'fas fa-newspaper',
    resource: 'fas fa-file-alt',
    activity: 'fas fa-calendar-alt',
  }
  return iconMap[type] || 'fas fa-file'
}

// 获取类型颜色
const getTypeColor = (type: string): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
  const colorMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
    news: 'primary',
    resource: 'success',
    activity: 'warning',
  }
  return colorMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type: string) => {
  const textMap: Record<string, string> = {
    news: '新闻',
    resource: '资源',
    activity: '活动',
  }
  return textMap[type] || '未知'
}

// 格式化日期
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN')
}

// 处理图片错误
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  const container = img.parentElement
  if (container) {
    container.innerHTML = '<i class="fas fa-image default-icon"></i>'
  }
}

// 监听选择状态
watch(
  () => selectedItems.value.length,
  newLength => {
    selectAll.value = newLength > 0 && newLength === favorites.value.length
  }
)

// 组件挂载
onMounted(() => {
  loadFavorites()
  loadStats()
  loadCategories()
})
</script>

<style scoped>
.user-favorites {
  max-width: 100%;
}

.favorites-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
}

.favorites-stats {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.favorites-list {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.select-all-checkbox {
  margin-bottom: 15px;
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.favorite-item {
  position: relative;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.favorite-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.favorite-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.item-checkbox {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
}

.item-content {
  cursor: pointer;
  padding: 10px;
}

.item-image {
  width: 100%;
  height: 120px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-image {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #909399;
  font-size: 24px;
}

.item-info {
  padding: 0 10px;
}

.item-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-description {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.type-tag,
.category-tag {
  margin: 0;
}

.collect-time {
  font-size: 12px;
  color: #999;
  margin-left: auto;
}

.item-tags {
  margin-bottom: 10px;
}

.tag-item {
  margin-right: 5px;
  margin-bottom: 5px;
}

.more-tags {
  font-size: 12px;
  color: #999;
}

.item-notes {
  font-size: 12px;
  color: #666;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin: 0;
  line-height: 1.4;
}

.item-notes i {
  margin-right: 5px;
  color: #999;
}

.item-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  padding: 2px;
}

.delete-btn {
  color: #f56c6c;
}

.pagination-wrapper {
  margin-top: 30px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.loading-wrapper {
  padding: 20px;
}

.category-manager {
  margin: 20px 0;
}

.category-list {
  max-height: 200px;
  overflow-y: auto;
}

.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.delete-category-btn {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .favorites-header {
    flex-direction: column;
    gap: 15px;
  }

  .header-left {
    flex-wrap: wrap;
    gap: 10px;
  }

  .favorites-grid {
    grid-template-columns: 1fr;
  }

  .item-meta {
    font-size: 12px;
  }
}
</style>
