const exp = require("express");
const axios = require("axios");
const murfApp = exp.Router();
const User = require("../models/user.model");
const {
  textToSpeech,
  getVoices,
  translateAudio,
  testConnection,
  murfClient,
  translateText,
  changeVoice,
} = require("../utils/murfApi");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // For handling file uploads
const fs = require("fs");
const util = require("util");
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
      translatedTo: translatedText, // Store translated text
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

// Change voice of an existing asset
murfApp.post("/change-asset-voice", async (req, res) => {
  try {
    const { assetId, userId, voiceId, options } = req.body;

    if (!assetId || !userId || !voiceId) {
      return res.status(400).json({ message: "Missing required parameters" });
    }

    // Find the user and asset
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the asset
    const asset = user.assets.id(assetId);
    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Get the audio URL from the asset
    const audioUrl = asset.audioUrl;

    // Change voice using Murf API
    const result = await changeVoice(audioUrl, voiceId, options || {});

    // Get new audio URL from response
    const newAudioUrl = result.audio_file;

    if (!newAudioUrl) {
      return res.status(500).json({
        message: "No audio URL returned from Murf API",
        apiResponse: result,
      });
    }

    // Create a new asset
    user.assets.push({
      name: `${asset.name} (Voice: ${voiceId})`,
      audioUrl: newAudioUrl,
      length: result.audio_length_in_seconds || 0,
      wordDurations: [],
    });

    await user.save();

    res.json({
      message: "Asset voice changed and saved as new asset",
      originalAsset: asset,
      newAsset: user.assets[user.assets.length - 1],
      transcription: result.transcription, // Include transcription if available
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error changing asset voice",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      },
    });
  }
});

// Streaming Text-to-Speech endpoint
murfApp.post("/tts/stream", async (req, res) => {
  try {
    const { text, voiceId, userId, format = "wav" } = req.body;

    if (!text || !voiceId) {
      return res
        .status(400)
        .json({ message: "Missing required parameters: text and voiceId" });
    }

    // Set appropriate headers for streaming
    res.setHeader(
      "Content-Type",
      format === "mp3" ? "audio/mpeg" : "audio/wav"
    );
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    const response = await axios.post(
      "https://api.murf.ai/v1/speech/stream",
      {
        text,
        voiceId,
        format,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.MURF_API,
        },
        responseType: "stream",
      }
    );

    // If userId is provided, we might want to save metadata (but not the stream itself)
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          user.assets.push({
            name: text.substring(0, 30) + (text.length > 30 ? "..." : ""),
            audioUrl: "streamed", // Indicate this was streamed
            length: 0, // Stream length unknown
            wordDurations: [],
            isStreamed: true,
          });
          await user.save();
        }
      } catch (userError) {
        console.error("Error saving stream metadata:", userError);
        // Don't fail the stream for user save errors
      }
    }

    // Pipe the audio stream directly to the response
    response.data.pipe(res);

    response.data.on("error", (error) => {
      console.error("Stream error:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Stream error", error: error.message });
      }
    });
  } catch (error) {
    console.error("Error in streaming TTS:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Error in streaming text-to-speech",
        error: {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        },
      });
    }
  }
});


module.exports = murfApp;

// Test Murf API connection
murfApp.get("/test-connection", async (req, res) => {
  try {
    const result = await testConnection();
    res.json({
      message: "Connection successful",
      result,
    });
  } catch (error) {
    // Detailed error response to help debug
    res.status(500).json({
      message: "Connection failed",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.baseURL + error.config?.url,
      },
    });
  }
});

// Updated API discovery route
murfApp.get("/discover-api", async (req, res) => {
  try {
    const results = {};

    // Try various potential base URLs and endpoints
    const potentialBaseUrls = [
      "https://api.murf.ai/api/v1",
      "https://api.murf.ai/v1",
      "https://api.murf.ai/api/v2",
      "https://api.murf.ai/v2",
    ];

    const potentialEndpoints = [
      "/tts",
      "/speech",
      "/speech/generate",
      "/text-to-speech",
      "/voices",
      "/voices/list",
      "/status",
    ];

    // Test each combination
    for (const baseUrl of potentialBaseUrls) {
      results[baseUrl] = {};

      for (const endpoint of potentialEndpoints) {
        try {
          const testClient = axios.create({
            baseURL: baseUrl,
            headers: {
              // Use api-key header instead of Authorization
              "api-key": process.env.MURF_API,
              "Content-Type": "application/json",
            },
            timeout: 5000, // Short timeout for discovery
          });

          // Use GET for discovery to avoid side effects
          const response = await testClient.get(endpoint);
          results[baseUrl][endpoint] = {
            status: response.status,
            success: true,
            data:
              typeof response.data === "object"
                ? "Object returned"
                : response.data,
          };
        } catch (error) {
          results[baseUrl][endpoint] = {
            status: error.response?.status,
            message: error.response?.data || error.message,
            success: false,
          };
        }
      }
    }

    res.json({
      message: "API discovery results",
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error running API discovery",
      error: error.message,
    });
  }
});

// Enhanced raw API testing endpoint
murfApp.post("/raw-test", async (req, res) => {
  try {
    const { endpoint, method, data, version } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: "Endpoint is required" });
    }

    const requestMethod = method?.toLowerCase() || "get";
    const apiVersion = version || "v1";

    // Create a fresh client for this test with the correct auth header
    const testClient = axios.create({
      baseURL: "https://api.murf.ai",
      headers: {
        // Use api-key header instead of Authorization
        "api-key": process.env.MURF_API,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    // Construct the full endpoint path with version if not included
    const fullEndpoint = endpoint.startsWith("/")
      ? endpoint.includes("/v")
        ? endpoint
        : `/${apiVersion}${endpoint}`
      : endpoint.includes("/v")
      ? `/${endpoint}`
      : `/${apiVersion}/${endpoint}`;

    console.log(
      `Making ${requestMethod.toUpperCase()} request to: ${fullEndpoint}`
    );

    let response;
    if (requestMethod === "get") {
      response = await testClient.get(fullEndpoint);
    } else if (requestMethod === "post") {
      response = await testClient.post(fullEndpoint, data || {});
    } else if (requestMethod === "put") {
      response = await testClient.put(fullEndpoint, data || {});
    } else if (requestMethod === "delete") {
      response = await testClient.delete(fullEndpoint);
    } else if (requestMethod === "options") {
      response = await testClient.options(fullEndpoint);
    }

    res.json({
      success: true,
      endpoint: fullEndpoint,
      method: requestMethod,
      data: response.data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      endpoint: req.body.endpoint,
      method: req.body.method || "get",
      error: {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      },
    });
  }
});

// Try different voice endpoints to find the correct one
murfApp.get("/find-voices-endpoint", async (req, res) => {
  try {
    const potentialVoiceEndpoints = [
      "/v1/voices",
      "/v1/voice",
      "/v1/speech/voices",
      "/v1/tts/voices",
      "/voices",
    ];

    const results = {};

    for (const endpoint of potentialVoiceEndpoints) {
      try {
        const response = await murfClient.get(endpoint);
        results[endpoint] = {
          status: response.status,
          success: true,
          data:
            typeof response.data === "object"
              ? "Object returned with keys: " +
                Object.keys(response.data).join(", ")
              : response.data,
        };
      } catch (error) {
        results[endpoint] = {
          status: error.response?.status,
          message: error.response?.data || error.message,
          success: false,
        };
      }
    }

    res.json({
      message: "Voice endpoints discovery results",
      results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error finding voices endpoint",
      error: error.message,
    });
  }
});
