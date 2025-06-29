import { useState, useContext, useRef, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { murfApi } from "../services/api";
import { FiType, FiMic, FiVolume2, FiUpload, FiRefreshCw } from "react-icons/fi";
import AudioPlayer from "./AudioPlayer";
import {getBaseUrl} from "../utils/config"

const TranslationPanel = () => {
  const { user } = useContext(UserContext);
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("es-ES");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [audioFile, setAudioFile] = useState(null);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  // Language options
  const languages = [
    { code: "es-ES", name: "Spanish" },
    { code: "fr-FR", name: "French" },
    { code: "de-DE", name: "German" },
    { code: "it-IT", name: "Italian" },
    { code: "pt-BR", name: "Portuguese" },
    { code: "hi-IN", name: "Hindi" },
    { code: "ja-JP", name: "Japanese" },
    { code: "zh-CN", name: "Chinese" },
  ];

  // Fetch voices on component mount
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const result = await murfApi.getVoices();
        if (result.voices && result.voices.length > 0) {
          setVoices(result.voices);
          // Set default voice
          setSelectedVoiceId(result.voices[0].id);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoices();
  }, []);

  // Handle text translation
  const handleTranslateText = async () => {
    if (!text.trim() || !targetLang) return;

    try {
      setIsTranslating(true);
      const result = await murfApi.translateText(text, targetLang, user?._id);
      if (result.translations && result.translations.length > 0) {
        setTranslatedText(result.translations[0].translated_text);
      }
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      setIsTranslating(false);
    }
  };

  // Handle text-to-speech translation
  const handleTranslateAndSpeak = async () => {
    if (!text.trim() || !targetLang || !selectedVoiceId || !user) return;

    try {
      setIsConverting(true);
      const result = await murfApi.translateAndSpeak(
        text,
        targetLang,
        selectedVoiceId,
        user._id
      );
      
      if (result.asset && result.asset.audioUrl) {
        setAudioUrl(result.asset.audioUrl);
        setTranslatedText(result.translation.translated);
      }
    } catch (error) {
      console.error("Translation and speech error:", error);
    } finally {
      setIsConverting(false);
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  // Handle speech-to-speech translation
  const handleTranslateSpeech = async () => {
    if (!audioFile || !targetLang || !selectedVoiceId || !user) return;

    try {
      setIsConverting(true);
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("targetLang", targetLang);
      formData.append("voiceId", selectedVoiceId);
      formData.append("userId", user._id);
      
      // Send the file directly to the server
      const response = await fetch(`${getBaseUrl()}/api/murf/translate-speech`, {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.asset && result.asset.audioUrl) {
        setAudioUrl(result.asset.audioUrl);
        // Set the actual transcription from the server
        if (result.transcription) {
          setTranslatedText(result.transcription.translated);
          setText(result.transcription.original);
        }
      }
    } catch (error) {
      console.error("Speech translation error:", error);
    } finally {
      setIsConverting(false);
      setAudioFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 dark:text-white">
      {/* Panel Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
        <h2 className="text-2xl font-bold text-white">Translation Panel</h2>
      </div>

      {/* Panel Content */}
      <div className="p-6">
        {/* Source Text Input */}
        <div className="mb-6">
          <label
            htmlFor="source-text"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200 mb-2"
          >
            <FiType className="text-blue-500" />
            Source Text
          </label>
          <textarea
            id="source-text"
            rows={4}
            className="w-full p-3 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="Enter text to translate..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        {/* Audio File Upload */}
        <div className="mb-6">
          <label
            htmlFor="audio-file"
            className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200 mb-2"
          >
            <FiMic className="text-blue-500" />
            Or Upload Audio File
          </label>
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              id="audio-file"
              accept="audio/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
            >
              <FiUpload className="text-blue-500" />
              <span>{audioFile ? audioFile.name : "Choose Audio File"}</span>
            </button>
            {audioFile && (
              <button
                onClick={() => {
                  setAudioFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-800/30 rounded text-red-700 dark:text-red-300 text-sm"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Translation Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Target Language */}
          <div>
            <label
              htmlFor="target-lang"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Target Language
            </label>
            <select
              id="target-lang"
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Voice Selection - Simple Dropdown */}
          <div>
            <label
              htmlFor="voice-select"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Target Voice
            </label>
            <select
              id="voice-select"
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loading}
            >
              {loading ? (
                <option>Loading voices...</option>
              ) : (
                voices.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.language})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleTranslateText}
            disabled={!text.trim() || isTranslating}
            className="px-4 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/30 rounded-lg text-blue-700 dark:text-blue-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiRefreshCw className={isTranslating ? "animate-spin" : ""} />
            {isTranslating ? "Translating..." : "Translate Text"}
          </button>

          <button
            onClick={handleTranslateAndSpeak}
            disabled={!text.trim() || !selectedVoiceId || isConverting || !user}
            className="px-4 py-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/30 rounded-lg text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiVolume2 className={isConverting ? "animate-pulse" : ""} />
            {isConverting ? "Converting..." : "Translate & Speak"}
          </button>

          {/* <button
            onClick={handleTranslateSpeech}
            disabled={!audioFile || !selectedVoiceId || isConverting || !user}
            className="px-4 py-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-800/30 rounded-lg text-purple-700 dark:text-purple-300 font-medium flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiMic className={isConverting ? "animate-pulse" : ""} />
            {isConverting ? "Converting..." : "Translate Speech"}
          </button> */}
        </div>

        {/* Translated Text Output */}
        {translatedText && (
          <div className="mb-6 animate-fade-in">
            <label
              htmlFor="translated-text"
              className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200 mb-2"
            >
              <FiType className="text-green-500" />
              Translated Text
            </label>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-900 dark:text-white dark:border-gray-700">
              {translatedText}
            </div>
          </div>
        )}

        {/* Audio Player */}
        {audioUrl && (
          <div className="mt-6 animate-fade-in">
            <label className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200 mb-2">
              <FiVolume2 className="text-green-500" />
              Audio Output
            </label>
            <AudioPlayer audioUrl={audioUrl} />
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslationPanel;