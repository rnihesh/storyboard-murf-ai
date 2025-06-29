const exp = require("express");
const axios = require("axios");
const murfApp = exp.Router();
const User = require("../models/user.model");
const fs = require("fs");
const path = require("path");
const util = require("util");
const multer = require("multer");
const FormData = require("form-data");
const {
  textToSpeech,
  getVoices,
  translateAudio,
  testConnection,
  murfClient,
  translateText,
  changeVoice,
} = require("../utils/murfApi");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory at:", uploadsDir);
}

const upload = multer({ dest: uploadsDir }); // For handling file uploads
const unlinkAsync = util.promisify(fs.unlink);
const WebSocket = require("ws");

// Get all available voices
murfApp.get("/voices", async (req, res, next) => {
  try {
    const voicesData = await getVoices();

    // Language code mapping
    const languageMap = {
      en: "English",
      es: "Spanish",
      fr: "French",
      de: "German",
      it: "Italian",
      pt: "Portuguese",
      nl: "Dutch",
      hi: "Hindi",
      bn: "Bengali",
      ta: "Tamil",
      ko: "Korean",
      ja: "Japanese",
      zh: "Chinese",
      pl: "Polish",
      el: "Greek",
      sk: "Slovak",
      hr: "Croatian",
    };

    // Region/country code mapping
    const regionMap = {
      US: "United States",
      UK: "United Kingdom",
      AU: "Australia",
      IN: "India",
      ES: "Spain",
      MX: "Mexico",
      FR: "France",
      DE: "Germany",
      IT: "Italy",
      BR: "Brazil",
      NL: "Netherlands",
      CN: "China",
      JP: "Japan",
      KR: "Korea",
      PL: "Poland",
      GR: "Greece",
      SK: "Slovakia",
      HR: "Croatia",
      SCOTT: "Scotland",
    };

    // Transform the response into a more structured format
    const formattedVoices = Object.values(voicesData).map((voice) => {
      // Extract language and region from voice ID
      const idParts = voice.voiceId?.split("-") || voice.id?.split("-") || [];
      const langCode = idParts[0] || "";
      const regionCode = idParts.length > 1 ? idParts[1] : "";

      // Derive language and region display names
      const language = languageMap[langCode] || langCode;
      const region = regionMap[regionCode] || regionCode;

      // Format display name
      const displayLanguage =
        language && region ? `${language} (${region})` : language || "Unknown";

      return {
        id: voice.voiceId || voice.id,
        name: voice.name || voice.voiceId || voice.id, // Use ID as name if not provided
        language: displayLanguage,
        languageCode: langCode,
        regionCode: regionCode,
        gender: voice.gender,
        accent: voice.accent,
        sampleAudio: voice.sampleAudio || voice.previewUrl,
      };
    });

    // Group voices by language for easier selection in the UI
    const voicesByLanguage = formattedVoices.reduce((groups, voice) => {
      const lang = voice.language || "Unknown";
      if (!groups[lang]) {
        groups[lang] = [];
      }
      groups[lang].push(voice);
      return groups;
    }, {});

    // Also group by accent for additional filtering options
    const voicesByAccent = formattedVoices.reduce((groups, voice) => {
      const accent = voice.accent || "Unknown";
      if (!groups[accent]) {
        groups[accent] = [];
      }
      groups[accent].push(voice);
      return groups;
    }, {});

    // Group by gender
    const voicesByGender = formattedVoices.reduce((groups, voice) => {
      const gender = voice.gender || "Unknown";
      if (!groups[gender]) {
        groups[gender] = [];
      }
      groups[gender].push(voice);
      return groups;
    }, {});

    res.json({
      message: "Available voices retrieved successfully",
      count: formattedVoices.length,
      voices: formattedVoices,
      voicesByLanguage,
      voicesByAccent,
      voicesByGender,
    });
  } catch (error) {
    console.error("Error fetching voices:", error);
    res.status(500).json({
      message: "Error fetching voices",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Convert text to speech and save to user's assets
murfApp.post("/tts", async (req, res, next) => {
  try {
    const { text, voiceId, options, userId } = req.body;

    if (!text || !voiceId || !userId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Convert text to speech using Murf API
    const result = await textToSpeech(text, voiceId, options);

    console.log("Result from text-to-speech: ", result);

    // Save the result to user's assets
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get audio URL from response - based on successful test response format
    const audioUrl = result.audioFile;

    if (!audioUrl) {
      return res.status(500).json({
        message: "No audio URL returned from Murf API",
        apiResponse: result,
      });
    }

    // Add the new audio to user's assets
    user.assets.push({
      name: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
      audioUrl: audioUrl,
      length: result.audioLengthInSeconds || 0,
      wordDurations: result.wordDurations || [], // Add the word durations to the asset
    });

    await user.save();

    res.json({
      message: "Text converted to speech and saved to user assets",
      asset: user.assets[user.assets.length - 1],
      wordDurations: result.wordDurations, // Include word timings for potential UI usage
      remainingCharacters: result.remainingCharacterCount,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error converting text to speech",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Generate speech in target language (audio translation workflow)
murfApp.post("/translate-speech", upload.single("file"), async (req, res) => {
  console.log("Received translate-speech request");
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Missing audio file. Please provide a file upload.",
      });
    }

    const { targetLang, voiceId, userId } = req.body;

    if (!targetLang || !voiceId || !userId) {
      await unlinkAsync(req.file.path);
      return res.status(400).json({
        message: "Missing required parameters: targetLang, voiceId, and userId",
      });
    }

    // 1. Transcribe the uploaded audio file to text
    // You must implement this function using your preferred speech-to-text provider
    const { speechToText } = require("../utils/murfApi"); // <-- implement this!
    const transcriptionResult = await speechToText(req.file.path);

    if (!transcriptionResult || !transcriptionResult.text) {
      await unlinkAsync(req.file.path);
      return res.status(500).json({
        message: "Failed to transcribe audio file",
      });
    }

    const originalText = transcriptionResult.text;

    // 2. Translate the transcribed text
    const translationResult = await translateText([originalText], targetLang);

    if (
      !translationResult.translations ||
      !translationResult.translations.length
    ) {
      await unlinkAsync(req.file.path);
      return res.status(500).json({
        message: "No translation returned from Murf API",
        apiResponse: translationResult,
      });
    }

    const translatedText = translationResult.translations[0].translated_text;

    // 3. Synthesize the translated text to speech
    const ttsResult = await textToSpeech(translatedText, voiceId, {
      speed: 1.0,
      pitch: 1.0,
      format: "mp3",
      quality: "high",
    });

    await unlinkAsync(req.file.path);

    // Save to user's assets
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const audioUrl = ttsResult.audioFile;

    if (!audioUrl) {
      return res.status(500).json({
        message: "No audio URL returned from Murf API",
        apiResponse: ttsResult,
      });
    }

    user.assets.push({
      name: `Audio: ${req.file.originalname}`,
      audioUrl: audioUrl,
      length: ttsResult.audioLengthInSeconds || 0,
      wordDurations: ttsResult.wordDurations || [],
      translatedFrom: originalText,
      translatedTo: translatedText,
    });

    await user.save();

    res.json({
      message: "Audio translated and generated successfully",
      asset: user.assets[user.assets.length - 1],
      transcription: {
        original: originalText,
        translated: translatedText,
      },
      wordDurations: ttsResult.wordDurations,
    });
  } catch (error) {
    console.error("Error in translate-speech:", error);
    if (req.file) {
      try {
        await unlinkAsync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up file:", cleanupError);
      }
    }
    return res.status(500).json({
      message: "Error generating audio",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Translate and generate speech (workflow combining text translation and TTS)
murfApp.post("/translate", async (req, res) => {
  try {
    const { text, targetLang, voiceId, userId } = req.body;

    if (!text || !targetLang || !voiceId || !userId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Step 1: Translate text
    const translationResult = await translateText([text], targetLang);

    if (
      !translationResult.translations ||
      !translationResult.translations.length
    ) {
      return res.status(500).json({
        message: "No translation returned from Murf API",
        apiResponse: translationResult,
      });
    }

    const translatedText = translationResult.translations[0].translated_text;

    // Step 2: Convert translated text to speech
    const ttsResult = await textToSpeech(
      translatedText,
      voiceId,
      req.body.options || {}
    );

    // Step 3: Save to user's assets
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const audioUrl = ttsResult.audioFile;

    if (!audioUrl) {
      return res.status(500).json({
        message: "No audio URL returned from Murf API",
        apiResponse: ttsResult,
      });
    }

    // Create a more descriptive name that includes both languages
    const assetName = `${text.substring(0, 20)}${
      text.length > 20 ? "..." : ""
    } → ${targetLang}`;

    // Add the new audio to user's assets
    user.assets.push({
      name: "Text to Audio Translation",
      audioUrl: audioUrl,
      length: ttsResult.audioLengthInSeconds || 0,
      wordDurations: ttsResult.wordDurations || [],
      translatedFrom: text, // Store original text
    });

    await user.save();

    res.json({
      message: "Text translated, converted to speech, and saved to user assets",
      asset: user.assets[user.assets.length - 1],
      translation: {
        original: text,
        translated: translatedText,
      },
      wordDurations: ttsResult.wordDurations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error in translation workflow",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Translate text to another language
murfApp.post("/translate-text", async (req, res) => {
  try {
    const { text, texts, targetLang, userId } = req.body;

    // Allow either a single text or an array of texts
    const textToTranslate = texts || (text ? [text] : null);

    if (!textToTranslate || !targetLang || !userId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Translate text using Murf API
    const result = await translateText(textToTranslate, targetLang);
    console.log("res from trans:", result);
    console.log("res trans from trans:", result.translations);

    // Save the translations to user's assets if needed
    if (req.body.saveToAssets) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Create assets for each translation if needed
      user.assets.push({
        name: "Translation",
        translatedFrom: result.translations[0].source_text,
        translatedTo: result.translations[0].translated_text,
        targetLang: result.metadata.target_language,
      });
      await user.save();
    }

    res.json({
      message: "Text translated successfully",
      translations: result.translations,
      metadata: result.metadata,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error translating text",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Change voice of an audio file and save to user's assets
murfApp.post(
  "/voice-changer",
  upload.single("file"),
  async (req, res, next) => {
    try {
      // Check if we have a file or a URL
      const hasFile = req.file;
      const hasUrl = req.body.audioUrl;

      if (!hasFile && !hasUrl) {
        return res.status(400).json({
          message:
            "Missing audio file or URL. Please provide either a file upload or an audioUrl.",
        });
      }

      const { voiceId, userId, options } = req.body;

      if (!voiceId || !userId) {
        // Clean up the uploaded file if it exists
        if (hasFile) {
          await unlinkAsync(req.file.path);
        }
        return res.status(400).json({
          message: "Missing required parameters: voiceId and userId",
        });
      }

      // Parse options if they're provided as a string
      const parsedOptions =
        typeof options === "string" ? JSON.parse(options) : options || {};

      // Prepare audio source with proper filename handling
      let audioSource;
      if (hasFile) {
        audioSource = req.file.path;
        // Add the original filename to options for proper extension handling
        parsedOptions.originalFilename = req.file.originalname;
      } else {
        audioSource = req.body.audioUrl;
      }

      // Change voice using Murf API
      const result = await changeVoice(audioSource, voiceId, parsedOptions);

      // Clean up the uploaded file if it exists
      if (hasFile) {
        await unlinkAsync(req.file.path);
      }

      // Save the result to user's assets
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get audio URL from response
      const audioUrl = result.audio_file;

      if (!audioUrl) {
        return res.status(500).json({
          message: "No audio URL returned from Murf API",
          apiResponse: result,
        });
      }

      // Create asset name based on original audio and target voice
      const assetName = hasFile
        ? `Voice Changed: ${req.file.originalname} → ${voiceId}`
        : `Voice Changed: Audio → ${voiceId}`;

      // Add the new audio to user's assets
      user.assets.push({
        name: assetName,
        audioUrl: audioUrl,
        length: result.audio_length_in_seconds || 0,
        wordDurations: [], // Voice changed audio doesn't typically include word durations
      });

      await user.save();

      res.json({
        message: "Audio voice changed and saved to user assets",
        asset: user.assets[user.assets.length - 1],
        transcription: result.transcription, // Include transcription if available
        originalAudioUrl: hasUrl ? req.body.audioUrl : null,
      });
    } catch (error) {
      // Clean up the uploaded file if it exists
      if (req.file) {
        try {
          await unlinkAsync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      return res.status(500).json({
        message: "Error changing voice",
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
  }
);

module.exports = murfApp;
