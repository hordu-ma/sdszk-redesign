<template>
  <div class="related-list">
    <div class="block-header">
      <h3>
        <i
:class="icon" class="header-icon" />
        <span class="title-text">{{ title }}</span>
      </h3>
    </div>
    <ul class="styled-list">
      <li v-for="item in items"
:key="item.id">
        <router-link :to="getItemLink(item)"
class="info-link">
          <div class="info-content">
            <div class="info-header">
              <span class="info-title">{{ item.title }}</span>
            </div>
            <div class="info-footer">
              <span v-if="item.date" class="info-date">
                发布日期：{{ formatDate(item.date) }}
              </span>
              <slot
name="footer" :item="item" />
            </div>
          </div>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

interface RelatedItem {
  id: string | number;
  title: string;
  date?: string | Date;
  [key: string]: any;
}

export default defineComponent({
  name: "RelatedList",
  props: {
    title: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      default: "fas fa-list",
    },
    items: {
      type: Array as () => RelatedItem[],
      required: true,
    },
    linkPrefix: {
      type: String,
      default: "",
    },
  },
  methods: {
    formatDate(date: string | Date): string {
      return new Date(date).toLocaleDateString("zh-CN");
    },
    getItemLink(item: RelatedItem): string {
      return `${this.linkPrefix}/${item.id}`;
    },
  },
});
</script>

<style scoped>
.related-list {
  margin-top: 40px;
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 4px;
}

.block-header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e8e8e8;
  padding-bottom: 10px;
  margin-bottom: 15px;
}

.block-header h3 {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  margin: 0;
}

.header-icon {
  margin-right: 8px;
  color: #1890ff;
}

.styled-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.styled-list li {
  margin-bottom: 15px;
}

.styled-list li:last-child {
  margin-bottom: 0;
}

.info-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.info-content {
  padding: 10px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.info-content:hover {
  background-color: #f0f0f0;
}

.info-header {
  margin-bottom: 5px;
}

.info-title {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.info-footer {
  font-size: 14px;
  color: #666;
}

.info-date {
  margin-right: 15px;
}
</style>
