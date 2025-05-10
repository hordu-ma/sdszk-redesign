import express from 'express';
import News from '../models/News.js';

const router = express.Router();

// 获取新闻列表
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const query = category ? { category } : {};
    
    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await News.countDocuments(query);
    
    res.json({
      data: news,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 获取单个新闻详情
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({ message: '新闻不存在' });
    }
    // 更新浏览量
    news.viewCount += 1;
    await news.save();
    res.json(news);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 创建新闻
router.post('/', async (req, res) => {
  try {
    const news = new News(req.body);
    const savedNews = await news.save();
    res.status(201).json(savedNews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 更新新闻
router.put('/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!news) {
      return res.status(404).json({ message: '新闻不存在' });
    }
    res.json(news);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 删除新闻
router.delete('/:id', async (req, res) => {
  try {
    const news = await News.findByIdAndDelete(req.params.id);
    if (!news) {
      return res.status(404).json({ message: '新闻不存在' });
    }
    res.json({ message: '新闻已删除' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;