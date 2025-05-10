import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    maxlength: 500,
    trim: true
  },
  thumbnail: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['center', 'notice', 'policy', 'activity', 'research', 'media']
  },
  publishDate: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  source: {
    name: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  },
  importance: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  attachments: [{
    name: String,
    url: String,
    size: Number,
    type: String
  }],
  seo: {
    metaTitle: {
      type: String,
      maxlength: 70
    },
    metaDescription: {
      type: String,
      maxlength: 160
    },
    keywords: [String]
  }
}, {
  timestamps: true
});

const News = mongoose.model('News', newsSchema);

export default News;