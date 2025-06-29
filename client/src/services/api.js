import axios from "axios";
import { getBaseUrl } from "../utils/config";

const BASE_URL = `${getBaseUrl()}/api`;

// Creating an axios instance with base URL
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// User related API calls
export const userApi = {
  createUser: async (userData) => {
    try {
      const response = await api.post("/user/create", userData);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },
};

// Murf API related calls
export const murfApi = {
  // Get all available voices
  getVoices: async () => {
    try {
      const response = await api.get("/murf/voices");
      return response.data;
    } catch (error) {
      console.error("Error fetching voices:", error);
      throw error;
    }
  },

  // Convert text to speech
  textToSpeech: async (text, voiceId, options, userId) => {
    try {
      const response = await api.post("/murf/tts", {
        text,
        voiceId,
        options,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error converting text to speech:", error);
      throw error;
    }
  },

  // Translate text
  translateText: async (text, targetLang, userId) => {
    try {
      const response = await api.post("/murf/translate-text", {
        text,
        targetLang,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error translating text:", error);
      throw error;
    }
  },

  // Translate and speak
  translateAndSpeak: async (text, targetLang, voiceId, userId) => {
    try {
      const response = await api.post("/murf/translate", {
        text,
        targetLang,
        voiceId,
        userId,
      });
      return response.data;
    } catch (error) {
      console.error("Error translating and speaking text:", error);
      throw error;
    }
  },
  
  // Translate speech (audio) to another language
  translateSpeech: async (audioFile, targetLang, voiceId, userId, options = {}) => {
    try {
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("targetLang", targetLang);
      formData.append("voiceId", voiceId);
      formData.append("userId", userId);
      
      if (options.sourceLanguage) {
        formData.append("options", JSON.stringify({
          sourceLanguage: options.sourceLanguage
        }));
      }
      
      const response = await fetch(`${BASE_URL}/murf/translate-speech`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error translating speech:", error);
      throw error;
    }
  },
};

// Story API service for story generation and management
export const storyApi = {
  generateStory: async (prompt) => {
    try {
      const response = await api.post("/story/generate", { prompt });
      return response.data;
    } catch (error) {
      console.error("Error generating story:", error);
      throw error;
    }
  },


  // Get all stories for a user
  getUserStories: async (userId) => {
    try {
      const response = await api.get(`/story/user/${userId}`);
      console.log(response.data)
      return response.data;
    } catch (error) {
      console.error("Error fetching user stories:", error);
      throw error;
    }
  },
};

export default api;
