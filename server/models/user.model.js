const mongoose = require("mongoose");

// Define a schema for word durations
const wordDurationSchema = new mongoose.Schema(
  {
    word: {
      type: String,
    },
    startMs: {
      type: Number,
    },
    endMs: {
      type: Number,
    },
    sourceWordIndex: {
      type: Number,
    },
    pitchScaleMinimum: {
      type: Number,
    },
    pitchScaleMaximum: {
      type: Number,
    },
  },
  { strict: "throw", timestamps: true }
);

const assetsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },
    audioUrl: {
      type: String,
    },
    length: {
      type: Number,
    },
    // Add the new wordDurations field to store timing information
    wordDurations: {
      type: [wordDurationSchema],
      default: [],
    },
    // Add these fields for translation assets
    translatedFrom: {
      type: String,
    },
    translatedTo: {
      type: String,
    },
    targetLang: {
      type: String,
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      // required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    profileImageUrl: {
      type: String,
      default:
        "https://cdn-icons-png.freepik.com/512/6645/6645221.png?ga=GA1.1.127309733.1746043095",
    },
    assets: {
      type: [assetsSchema],
    },
  },
  {
    strict: "throw",
    timestamps: true,
  }
);

const User = mongoose.model("user", userSchema);

module.exports = User;
