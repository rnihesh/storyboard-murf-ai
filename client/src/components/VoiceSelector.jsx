import { useContext, useState, useEffect } from "react";
import { StoryContext } from "../contexts/StoryContext";
import {
  FiUser,
  FiGlobe,
  FiPlayCircle,
  FiPause,
  FiChevronDown,
  FiMic,
} from "react-icons/fi";

const VoiceSelector = ({ onVoiceSelect }) => {
  const { voices, voicesByLanguage, selectedVoice, setSelectedVoice } =
    useContext(StoryContext);
  const [samplePlaying, setSamplePlaying] = useState(false);
  const [audioElement, setAudioElement] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = "";
      }
    };
  }, [audioElement]);

  const handleVoiceChange = (voice) => {
    if (voice) {
      setSelectedVoice(voice);
      // Call the onVoiceSelect prop if provided
      if (onVoiceSelect) {
        onVoiceSelect(voice.id);
      }
      // Stop any playing sample
      if (audioElement) {
        audioElement.pause();
        setSamplePlaying(false);
      }
      setIsOpen(false);
    }
  };

  const playSample = (e) => {
    e.stopPropagation();
    if (!selectedVoice?.sampleAudio) return;

    // If we already have an audio element
    if (audioElement) {
      if (samplePlaying) {
        audioElement.pause();
        setSamplePlaying(false);
      } else {
        audioElement.play();
        setSamplePlaying(true);
      }
      return;
    }

    // Create a new audio element
    const audio = new Audio(selectedVoice.sampleAudio);
    audio.addEventListener("ended", () => {
      setSamplePlaying(false);
    });

    setAudioElement(audio);
    audio.play().catch((error) => {
      console.error("Error playing sample:", error);
    });
    setSamplePlaying(true);
  };

  if (!voices.length) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="animate-spin h-6 w-6 rounded-full border-2 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading voices...
          </p>
        </div>
      </div>
    );
  }

  const languages = Object.keys(voicesByLanguage).sort();
  const currentVoices = voicesByLanguage[selectedVoice?.language] || [];

  return (
    <div className="mb-4 relative" style={{ zIndex: 100 }}>
      {/* Main voice selector button */}
      <div className="flex flex-col gap-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded text-purple-700 dark:text-purple-400">
              <FiMic className="w-4 h-4" />
            </div>
            Select Voice
          </label>

          {/* Current voice display */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors py-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {selectedVoice?.name || "Select a voice"}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {selectedVoice?.language} - {selectedVoice?.accent}
              </span>
            </div>
            <FiChevronDown
              className={`transition-transform duration-300 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Sample player */}
        {selectedVoice && selectedVoice.sampleAudio && (
          <div className="flex justify-end">
            <button
              onClick={playSample}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-md text-sm transition-colors ${
                samplePlaying
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400"
              }`}
            >
              {samplePlaying ? (
                <FiPause className="w-4 h-4" />
              ) : (
                <FiPlayCircle className="w-4 h-4" />
              )}
              <span>{samplePlaying ? "Stop Sample" : "Play Sample"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dropdown for voice selection */}
      {isOpen && (
        <div className="fixed sm:absolute z-50 w-full sm:w-[calc(100%-1rem)] left-0 sm:left-auto right-0 sm:right-auto top-auto mt-1 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-xl animate-fade-in-up max-h-[80vh] sm:max-h-[400px] overflow-hidden">
          {/* Language selector */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-20">
            <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
              <FiGlobe className="w-4 h-4" />
              <span>Language</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
              {languages.map((language) => (
                <button
                  key={language}
                  onClick={() => {
                    // Set first voice of selected language
                    if (voicesByLanguage[language]?.length > 0) {
                      const selectedVoice = voicesByLanguage[language][0];
                      setSelectedVoice(selectedVoice);
                      // Call the onVoiceSelect prop if provided
                      if (onVoiceSelect) {
                        onVoiceSelect(selectedVoice.id);
                      }
                      if (audioElement) {
                        audioElement.pause();
                        setSamplePlaying(false);
                      }
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedVoice?.language === language
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-transparent"
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
          </div>

          {/* Voice options */}
          <div className="p-2 max-h-[250px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {currentVoices.map((voice) => (
              <button
                key={voice.id}
                onClick={() => handleVoiceChange(voice)}
                className={`p-3 flex justify-between items-center cursor-pointer rounded-lg transition-colors w-full text-left ${
                  selectedVoice?.id === voice.id
                    ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedVoice?.id === voice.id
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    <FiUser className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {voice.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {voice.gender} • {voice.accent || voice.language}
                    </div>
                  </div>
                </div>

                {voice.sampleAudio && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Set as selected voice but also play sample
                      setSelectedVoice(voice);
                      // Call the onVoiceSelect prop if provided
                      if (onVoiceSelect) {
                        onVoiceSelect(voice.id);
                      }

                      // Create new audio for this voice
                      if (audioElement) {
                        audioElement.pause();
                      }

                      const audio = new Audio(voice.sampleAudio);
                      audio.addEventListener("ended", () => {
                        setSamplePlaying(false);
                      });

                      setAudioElement(audio);
                      audio.play().catch((error) => {
                        console.error("Error playing sample:", error);
                      });
                      setSamplePlaying(true);
                    }}
                    className="p-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
                  >
                    <FiPlayCircle className="w-4 h-4" />
                  </button>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
