import { createContext, useState, useEffect, useContext } from "react";
import { murfApi, storyApi } from "../services/api";
import { UserContext } from "./UserContext";

export const StoryContext = createContext({
  story: "",
  voices: [],
  selectedVoice: null,
  loading: false,
  audioUrl: null,
  generating: false,
  setStory: () => {},
  setSelectedVoice: () => {},
  generateStory: () => {},
  convertToSpeech: () => {},
});

export const StoryProvider = ({ children }) => {
  const { user } = useContext(UserContext);
  const [story, setStory] = useState("");
  const [voices, setVoices] = useState([]);
  const [voicesByLanguage, setVoicesByLanguage] = useState({});
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [generating, setGenerating] = useState(false);

  // Fetch available voices when component mounts
  useEffect(() => {
    const fetchVoices = async () => {
      try {
        const response = await murfApi.getVoices();
        setVoices(response.voices);
        setVoicesByLanguage(response.voicesByLanguage);

        // Set a default voice (English US)
        if (response.voices.length > 0) {
          const defaultVoice =
            response.voices.find(
              (v) => v.language === "English" && v.accent === "United States"
            ) || response.voices[0];

          setSelectedVoice(defaultVoice);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
      }
    };

    fetchVoices();
  }, []);

  // Generate a story using Gemini API
  const generateStory = async (prompt) => {
    if (!prompt) return;

    try {
      setGenerating(true);
      setStory("");

      const response = await storyApi.generateStory(prompt);
      setStory(response.story);
      return response.story;
    } catch (error) {
      console.error("Error generating story:", error);
      throw error;
    } finally {
      setGenerating(false);
    }
  };

  // Convert story to speech
  const convertToSpeech = async (options = {}) => {
    if (!story || !selectedVoice || !user) return;

    try {
      setLoading(true);

      const response = await murfApi.textToSpeech(
        story,
        selectedVoice.id,
        options,
        user._id
      );

      setAudioUrl(response.asset.audioUrl);
      return response;
    } catch (error) {
      console.error("Error converting to speech:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <StoryContext.Provider
      value={{
        story,
        voices,
        voicesByLanguage,
        selectedVoice,
        loading,
        audioUrl,
        generating,
        setStory,
        setSelectedVoice,
        generateStory,
        convertToSpeech,
      }}
    >
      {children}
    </StoryContext.Provider>
  );
};

export default StoryProvider;
