const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const storyApp = express.Router();
require("dotenv").config();
const User = require("../models/user.model");

// Initialize the Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate a story using Gemini API
storyApp.post(
  "/generate",
  expressAsyncHandler(async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        message:
          "Gemini API key is missing. Please set GEMINI_API_KEY in environment variables.",
      });
    }

    try {
      // Get the model (using the newer version Gemini 2.0 Flash)
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
      });

      // Configure generation parameters
      const generationConfig = {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      };

      // Generate content
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Create a creative and engaging short story based on the following prompt. Make it between 200-400 words: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig,
      });

      console.log("gemini result:", result);
      const response = await result.response;
      console.log("gemini response:", response);
      const generatedText = response.text();
      console.log("Gemini generated story successfully", generatedText);

      if (!generatedText) {
        throw new Error("No story was generated");
      }

      res.json({
        message: "Story generated successfully",
        story: generatedText,
      });
    } catch (error) {
      console.error("Error generating story:", error);
      res.status(500).json({
        message: "Error generating story",
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
  })
);

// Save a story to user's assets
storyApp.post(
  "/save",
  expressAsyncHandler(async (req, res) => {
    const { userId, title, content, audioUrl } = req.body;

    if (!userId || !content) {
      return res
        .status(400)
        .json({ message: "User ID and content are required" });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a new asset with story content
    const storyAsset = {
      name:
        title || content.substring(0, 30) + (content.length > 30 ? "..." : ""),
      audioUrl: audioUrl || null,
      length: 0, // Will be updated if TTS is generated
      content: content, // Adding content field to store story text
      isStory: true, // Flag to identify this as a story asset
      createdAt: new Date(),
    };

    // Add to user's assets
    user.assets.push(storyAsset);
    await user.save();

    res.json({
      message: "Story saved successfully to user assets",
      asset: user.assets[user.assets.length - 1],
    });
  })
);

// Get all stories for a user from their assets
storyApp.get(
  "/user/:userId",
  expressAsyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Check if user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Filter assets that are stories and sort by most recent
    const stories = user.assets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sort by createdAt timestamp

    res.json({
      message: "Stories retrieved successfully",
      stories,
    });
  })
);

// Get a single story by asset ID
storyApp.get(
  "/:assetId",
  expressAsyncHandler(async (req, res) => {
    const { assetId } = req.params;
    const { userId } = req.query;

    if (!assetId) {
      return res.status(400).json({ message: "Asset ID is required" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ message: "User ID is required as a query parameter" });
    }

    // Find user and then find the specific asset
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const story = user.assets.id(assetId);
    if (!story) {
      return res
        .status(404)
        .json({ message: "Story not found in user assets" });
    }

    res.json({
      message: "Story retrieved successfully",
      story,
    });
  })
);

module.exports = storyApp;
