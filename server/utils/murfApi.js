const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types"); // You'll need to install this: npm install mime-types
require("dotenv").config();

const MURF_API_KEY = process.env.MURF_API;
const MURF_BASE_URL = "https://api.murf.ai";

// Configure axios instance for Murf API
const murfClient = axios.create({
  baseURL: MURF_BASE_URL,
  headers: {
    "api-key": MURF_API_KEY,
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Convert text to speech using Murf AI
 * @param {string} text - Text to convert to speech
 * @param {string} voiceId - Voice ID to use
 * @param {Object} options - Additional options like speed, pitch, etc.
 * @returns {Promise} - Response from Murf API with audio URL
 */
async function textToSpeech(text, voiceId, options = {}) {
  try {
    // Using the confirmed working endpoint
    const response = await murfClient.post("/v1/speech/generate", {
      text,
      voiceId: voiceId,
      speed: options.speed || 1.0,
      pitch: options.pitch || 1.0,
      format: options.format || "mp3",
      quality: options.quality || "high",
    });

    console.log("TTS Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in Murf textToSpeech:");
    console.error("Status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Request URL:", error.config?.baseURL + error.config?.url);
    console.error("Request data:", error.config?.data);
    throw error;
  }
}

/**
 * Get available voices from Murf AI
 * @returns {Promise} - List of available voices
 */
async function getVoices() {
  try {
    // Use the confirmed working endpoint
    const response = await murfClient.get("/v1/speech/voices");
    return response.data;
  } catch (error) {
    console.error(
      "Error in Murf getVoices:",
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Translate text to another language
 * @param {string|string[]} texts - Text or array of texts to translate
 * @param {string} targetLang - Target language code (e.g. 'es-ES')
 * @returns {Promise} - Response with translated text
 */
async function translateText(texts, targetLang) {
  try {
    // Convert single text to array if needed
    const textArray = Array.isArray(texts) ? texts : [texts];

    // Use the correct endpoint from the documentation
    const response = await murfClient.post("/v1/text/translate", {
      targetLanguage: targetLang,
      texts: textArray,
    });

    console.log("Translation Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in Murf translateText:");
    console.error("Status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Request URL:", error.config?.baseURL + error.config?.url);
    console.error("Request data:", error.config?.data);
    throw error;
  }
}

// Keep the old function for backward compatibility
async function translateAudio(audioUrl, targetLang, voiceId) {
  console.warn("translateAudio is deprecated. Use translateText instead.");
  // Throw an informative error
  throw new Error(
    "Murf API does not support direct audio translation. Please use text translation and then convert to speech."
  );
}

/**
 * Change voice of an audio file using Murf AI
 * @param {string|Buffer|Stream} audioFile - Path to audio file, buffer or stream
 * @param {string} voiceId - Target voice ID
 * @param {Object} options - Additional options
 * @returns {Promise} - Response from Murf API with transformed audio URL
 */
async function changeVoice(audioFile, voiceId, options = {}) {
  try {
    const form = new FormData();

    // Handle different types of audio file inputs
    if (typeof audioFile === "string") {
      // If it's a file path
      if (fs.existsSync(audioFile)) {
        const fileStream = fs.createReadStream(audioFile);
        const fileName = path.basename(audioFile);
        const fileExtension = path.extname(audioFile) || ".mp3";

        // Ensure we have a proper filename with extension
        const finalFileName = fileName.includes(".")
          ? fileName
          : `audio${fileExtension}`;

        form.append("file", fileStream, finalFileName);
      }
      // If it's a URL
      else if (audioFile.startsWith("http")) {
        const response = await axios.get(audioFile, { responseType: "stream" });
        console.log(
          "From murfApi changeVoice, res of audiofile axios get: ",
          response
        );
        console.log();

        // Parse URL to get clean extension without query parameters
        const urlObj = new URL(audioFile);
        const pathname = urlObj.pathname; // This removes query parameters
        let extension = path.extname(pathname) || ".mp3";

        console.log("Original URL:", audioFile);
        console.log("Pathname:", pathname);
        console.log("Clean extension:", extension);
        console.log();

        // Validate extension and fallback to content-type if needed
        const validExtensions = [
          ".mp3",
          ".wav",
          ".m4a",
          ".aac",
          ".ogg",
          ".webm",
          ".flac",
        ];
        if (!validExtensions.includes(extension.toLowerCase())) {
          const contentType = response.headers["content-type"];
          console.log("Content-Type:", contentType);

          if (contentType) {
            const mimeExtension = mime.extension(contentType);
            extension = mimeExtension ? `.${mimeExtension}` : ".mp3";
          } else {
            extension = ".mp3"; // Default fallback
          }
        }

        const fileName = `audio_file${extension}`;
        console.log("Final file name:", fileName);
        console.log();

        form.append("file", response.data, fileName);
      } else {
        throw new Error("Invalid audio file path or URL");
      }
    }
    // If it's already a buffer or stream
    else if (
      Buffer.isBuffer(audioFile) ||
      (audioFile && typeof audioFile.pipe === "function")
    ) {
      // Default to .mp3 for buffers/streams unless specified
      const fileName = options.fileName || "audio_file.mp3";
      form.append("file", audioFile, fileName);
    } else {
      throw new Error("Invalid audio file format");
    }

    // Add voice_id parameter (note: underscore, not camelCase)
    form.append("voice_id", voiceId);

    // Add optional parameters if specified
    if (options.retainProsody !== undefined) {
      form.append("retain_prosody", options.retainProsody.toString());
    }

    if (options.retainAccent !== undefined) {
      form.append("retain_accent", options.retainAccent.toString());
    }

    if (options.returnTranscription !== undefined) {
      form.append(
        "return_transcription",
        options.returnTranscription.toString()
      );
    }

    if (options.transcription) {
      form.append("transcription", options.transcription);
    }

    if (options.speed) {
      form.append("speed", options.speed.toString());
    }

    if (options.pitch) {
      form.append("pitch", options.pitch.toString());
    }

    // Make the API request with the FormData
    const response = await axios.post(
      "https://api.murf.ai/v1/voice-changer/convert",
      form,
      {
        headers: {
          ...form.getHeaders(),
          "api-key": MURF_API_KEY,
        },
        timeout: 120000, // 2 minutes timeout for voice conversion
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log("Voice Change Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error in Murf changeVoice:");
    console.error("Status:", error.response?.status);
    console.error("Response data:", error.response?.data);
    console.error("Request URL:", error.config?.url);
    throw error;
  }
}

// /**
//  * Stream text to speech using Murf AI HTTP streaming
//  * @param {string} text - Text to convert to speech
//  * @param {string} voiceId - Voice ID to use
//  * @param {Object} options - Additional options like format
//  * @returns {Promise} - Stream response from Murf API
//  */
// async function streamTextToSpeech(text, voiceId, options = {}) {
//   try {
//     const response = await murfClient.post(
//       "/v1/speech/stream",
//       {
//         text,
//         voiceId,
//         format: options.format || "wav",
//       },
//       {
//         responseType: "stream",
//       }
//     );

//     return response;
//   } catch (error) {
//     console.error("Error in Murf streamTextToSpeech:");
//     console.error("Status:", error.response?.status);
//     console.error("Response data:", error.response?.data);
//     throw error;
//   }
// }



/**
 * Test connection to Murf API
 * @returns {Promise} - Basic API info
 */
async function testConnection() {
  try {
    // We know OPTIONS on /v1/speech/generate works from our test
    const response = await murfClient.options("/v1/speech/generate");
    return {
      status: response.status,
      headers: response.headers,
      message: "Connection successful",
    };
  } catch (error) {
    console.error(
      "Error in Murf API connection test:",
      error.response?.data || error.message
    );
    throw error;
  }
}

module.exports = {
  textToSpeech,
  getVoices,
  translateText,
  translateAudio,
  testConnection,
  murfClient,
  changeVoice,
 // streamTextToSpeech, // Add streaming function
 // createTTSWebSocket, // Add WebSocket function
};
