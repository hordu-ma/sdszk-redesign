// Activity.js - 活动模型
import mongoose from 'mongoose'

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    poster: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      coordinates: {
        longitude: Number,
        latitude: Number,
      },
      isOnline: {
        type: Boolean,
        default: false,
      },
      onlineUrl: {
        type: String,
        trim: true,
      },
    },
    organizer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      logo: String,
      description: String,
      contact: String,
    },
    coOrganizers: [
      {
        name: {
          type: String,
          trim: true,
        },
        logo: String,
      },
    ],
    category: {
      type: String,
      enum: ['conference', 'seminar', 'workshop', 'competition', 'lecture', 'other'],
      default: 'other',
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed', 'canceled', 'postponed'],
      default: 'upcoming',
    },
    registrationRequired: {
      type: Boolean,
      default: false,
    },
    registrationDeadline: {
      type: Date,
    },
    registrationUrl: {
      type: String,
      trim: true,
    },
    maxAttendees: {
      type: Number,
      min: 0,
    },
    currentAttendees: {
      type: Number,
      default: 0,
      min: 0,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        size: Number,
        type: String,
      },
    ],
    images: [
      {
        url: String,
        caption: String,
      },
    ],
    agenda: [
      {
        time: Date,
        title: String,
        description: String,
        speaker: String,
      },
    ],
    speakers: [
      {
        name: {
          type: String,
          trim: true,
        },
        title: {
          type: String,
          trim: true,
        },
        organization: {
          type: String,
          trim: true,
        },
        bio: String,
        avatar: String,
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

const Activity = mongoose.model('Activity', activitySchema)

export default Activity
