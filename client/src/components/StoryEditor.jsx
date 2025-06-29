import { useContext, useState, useRef, useEffect } from "react";
import { StoryContext } from "../contexts/StoryContext";
import { UserContext } from "../contexts/UserContext";
import {
  FiVolume2,
  FiCopy,
  FiCheck,
  FiSave,
  FiShare2,
  FiType,
  FiSliders,
  FiMic,
  FiBookOpen,
  FiMusic,
} from "react-icons/fi";
import { storyApi } from "../services/api";
import VoiceSelector from "./VoiceSelector";
import AudioPlayer from "./AudioPlayer";

const StoryEditor = () => {
  const { story, setStory, convertToSpeech, loading, audioUrl } =
    useContext(StoryContext);
  const { user } = useContext(UserContext);
  const [speechOptions, setSpeechOptions] = useState({
    speed: 1.0,
    pitch: 1.0,
  });
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const textareaRef = useRef(null);
  const [showSpeechOptions, setShowSpeechOptions] = useState(false);

  useEffect(() => {
    if (story) {
      setCharCount(story.length);
      setWordCount(story.trim() ? story.trim().split(/\s+/).length : 0);
    } else {
      setCharCount(0);
      setWordCount(0);
    }
  }, [story]);

  const handleStoryChange = (e) => {
    setStory(e.target.value);
  };

  const handleConvertToSpeech = async () => {
    if (!story || !story.trim()) return;
    try {
      await convertToSpeech(speechOptions);
      // Automatically show audio player after conversion
      window.scrollTo({
        top: document.getElementById("audioPlayer")?.offsetTop,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Error converting to speech:", error);
    }
  };

  const handleOptionChange = (e) => {
    const { name, value } = e.target;
    setSpeechOptions((prev) => ({
      ...prev,
      [name]: parseFloat(value),
    }));
  };

  const handleCopyText = () => {
    if (textareaRef.current) {
      navigator.clipboard.writeText(textareaRef.current.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenSaveDialog = () => {
    if (!story || !story.trim() || !user) return;
    // Set a default title based on first few words of story
    const defaultTitle = story.trim().split(" ").slice(0, 4).join(" ") + "...";
    setStoryTitle(defaultTitle);
    setShowSaveDialog(true);
  };

  const handleSaveStory = async () => {
    if (!story || !story.trim() || !user || !storyTitle || !storyTitle.trim()) return;

    try {
      setIsSaving(true);
      const result = await storyApi.saveStory(
        user._id,
        storyTitle,
        story,
        audioUrl
      );
      setSaveSuccess(true);
      setShowSaveDialog(false);

      // Show success message with animation
      const successElement = document.createElement("div");
      successElement.className =
        "fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center transform transition-all duration-500 ease-out animate-fade-in";
      successElement.innerHTML =
        '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Story saved successfully!';
      document.body.appendChild(successElement);

      // Add entrance animation
      setTimeout(() => {
        successElement.style.opacity = "1";
        successElement.style.transform = "translateY(0)";
      }, 10);

      // Reset success message after a delay
      setTimeout(() => {
        successElement.style.opacity = "0";
        successElement.style.transform = "translateY(-20px)";
        setTimeout(() => {
          successElement.remove();
          setSaveSuccess(false);
        }, 500);
      }, 3000);
    } catch (error) {
      console.error("Error saving story:", error);
      // Show error message
      const errorElement = document.createElement("div");
      errorElement.className =
        "fixed top-4 right-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg shadow-xl z-50 flex items-center";
      errorElement.innerHTML =
        '<svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg> Failed to save story';
      document.body.appendChild(errorElement);

      setTimeout(() => {
        errorElement.remove();
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto dark:text-white">
      {/* Editor Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
        <div className="flex items-center gap-3">
          <FiBookOpen className="text-white text-xl" />
          <h2 className="text-2xl font-bold text-white">Story Editor</h2>
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <label
              htmlFor="story"
              className="flex items-center gap-2 text-base font-semibold text-gray-800 dark:text-gray-200"
            >
              <FiType className="text-purple-500" />
              Your Story
            </label>
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full text-xs font-medium text-indigo-700 dark:text-indigo-300">
              <span>{wordCount} words</span>
              <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
              <span>{charCount} characters</span>
            </div>
          </div>

          <div className="relative group">
            <textarea
              ref={textareaRef}
              id="story"
              rows={10}
              className="w-full p-4 border border-gray-200 rounded-xl bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg shadow-sm dark:placeholder-gray-400"
              placeholder="Once upon a time..."
              value={story}
              onChange={handleStoryChange}
              style={{ resize: "none" }}
            />

            <div className="absolute top-3 right-3 flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopyText}
                className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 transition-colors"
                title="Copy text"
              >
                {copied ? (
                  <FiCheck className="w-4 h-4 text-green-500" />
                ) : (
                  <FiCopy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleOpenSaveDialog}
                disabled={!story || !story.trim() || !user}
                className="p-2 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800 rounded-lg text-purple-700 dark:text-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save story"
              >
                <FiSave className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Convert to Speech Section */}
        <div className="mt-10 mb-6" style={{ position: 'relative', zIndex: 1 }}>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl p-5 border border-indigo-100 dark:border-indigo-800 ">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <FiMic className="text-purple-600 dark:text-purple-400" />
                Convert to Speech
              </h3>
              <button
                onClick={() => setShowSpeechOptions(!showSpeechOptions)}
                className="flex items-center gap-1 text-sm bg-white dark:bg-gray-800 px-3 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <FiSliders className="w-3 h-3" />
                <span>{showSpeechOptions ? "Hide" : "Show"} Options</span>
              </button>
            </div>

            <VoiceSelector />

            {showSpeechOptions && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-5 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="speech-speed"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Speed
                    </label>
                    <span className="text-sm bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 font-medium">
                      {speechOptions.speed}x
                    </span>
                  </div>
                  <input
                    type="range"
                    id="speech-speed"
                    name="speed"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechOptions.speed}
                    onChange={handleOptionChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                    <span>Slower</span>
                    <span>Default</span>
                    <span>Faster</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label
                      htmlFor="speech-pitch"
                      className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Pitch
                    </label>
                    <span className="text-sm bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded text-purple-700 dark:text-purple-300 font-medium">
                      {speechOptions.pitch}x
                    </span>
                  </div>
                  <input
                    type="range"
                    id="speech-pitch"
                    name="pitch"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={speechOptions.pitch}
                    onChange={handleOptionChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:bg-gray-700"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                    <span>Lower</span>
                    <span>Default</span>
                    <span>Higher</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleConvertToSpeech}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl text-white font-medium flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transform hover:translate-y-[-1px] active:translate-y-[1px]"
              disabled={!story || !story.trim() || loading}
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
                  <span>Converting to speech...</span>
                </>
              ) : (
                <>
                  <FiVolume2 className="text-lg" />
                  <span>Convert to Speech</span>
                </>
              )}
            </button>
          </div>

          {/* Audio Player */}
          <div id="audioPlayer" className="mt-6">
            {audioUrl && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl p-5 border border-blue-100 dark:border-blue-800 mt-6 animate-fade-in">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2 mb-3">
                  <FiMusic className="text-blue-600 dark:text-blue-400" />
                  Audio Playback
                </h3>
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4">
              <h3 className="text-xl font-bold text-white">Save Your Story</h3>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label
                  htmlFor="story-title"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Story Title
                </label>
                <input
                  id="story-title"
                  type="text"
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter a title for your story"
                  autoFocus
                />
              </div>

              {/* Preview of story */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Preview
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm max-h-24 overflow-y-auto">
                  {story.substring(0, 100)}
                  {story.length > 100 ? "..." : ""}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    audioUrl ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                  }`}
                ></div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {audioUrl ? "Audio will be included" : "No audio attached"}
                </span>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStory}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-not-allowed min-w-[100px]"
                  disabled={isSaving || !storyTitle.trim()}
                >
                  {isSaving ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave />
                      <span>Save Story</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryEditor;
