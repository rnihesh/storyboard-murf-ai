import { useState, useEffect, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { StoryContext } from "../contexts/StoryContext";
import { storyApi } from "../services/api";
import {
  FiBookOpen,
  FiPlay,
  FiEdit,
  FiPause,
  FiMusic,
  FiRefreshCw,
  FiClock,
  FiCalendar,
  FiType,
} from "react-icons/fi";

const StoriesList = () => {
  const { user } = useContext(UserContext);
  const { setStory } = useContext(StoryContext);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [audio, setAudio] = useState(null);
  const [selectedTab, setSelectedTab] = useState("all"); // "all", "audio", "text"

  useEffect(() => {
    if (user) {
      fetchUserStories();
    }
  }, [user]);

  useEffect(() => {
    // Clean up audio when component unmounts
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [audio]);

  const fetchUserStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await storyApi.getUserStories(user._id);
      setStories(response.stories);
    } catch (error) {
      console.error("Error fetching user stories:", error);
      setError("Failed to load your stories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadStory = (story) => {
    setStory(story.content);
  };

  const handlePlayAudio = (story) => {
    // If we're currently playing this story, stop it
    if (playingId === story._id) {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
      setPlayingId(null);
      return;
    }

    // If there's no audio URL, don't do anything
    if (!story.audioUrl) return;

    // If we have an existing audio element, stop it
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    // Create and play the new audio
    const newAudio = new Audio(story.audioUrl);
    newAudio.onended = () => {
      setPlayingId(null);
    };

    newAudio.play().catch((error) => {
      console.error("Error playing audio:", error);
      setPlayingId(null);
    });

    setAudio(newAudio);
    setPlayingId(story._id);
  };

  // Filter stories based on selected tab
  const filteredStories = stories.filter((story) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "audio") return !!story.audioUrl;
    if (selectedTab === "text") return !story.audioUrl;
    return true;
  });

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return (
        "Today, " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays === 1) {
      return (
        "Yesterday, " +
        date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiBookOpen className="text-white text-xl" />
            <h2 className="text-2xl font-bold text-white">My History</h2>
          </div>
          <button
            onClick={fetchUserStories}
            className="flex items-center gap-2 text-white bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200"
            disabled={loading}
          >
            <FiRefreshCw className={`${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mt-6 space-x-1 border-b border-white/20">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all ${
              selectedTab === "all"
                ? "bg-white text-purple-700"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            All Stories
          </button>
          <button
            onClick={() => setSelectedTab("audio")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              selectedTab === "audio"
                ? "bg-white text-purple-700"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FiMusic className="w-3 h-3" />
            With Audio
          </button>
          <button
            onClick={() => setSelectedTab("text")}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-all flex items-center gap-2 ${
              selectedTab === "text"
                ? "bg-white text-purple-700"
                : "text-white/80 hover:bg-white/10"
            }`}
          >
            <FiType className="w-3 h-3" />
            Text Only
          </button>
        </div>
      </div>

      {/* Stories List */}
      <div className="p-5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Loading your stories...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center text-red-600 dark:text-red-400">
            <p className="font-medium">{error}</p>
            <button
              onClick={fetchUserStories}
              className="mt-2 text-sm bg-red-100 dark:bg-red-800 px-3 py-1 rounded-md hover:bg-red-200 dark:hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-10 text-center">
            <FiBookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {selectedTab === "all"
                ? "No stories yet"
                : selectedTab === "audio"
                ? "No stories with audio yet"
                : "No text-only stories yet"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Generate a new story, add audio narration, and save it to your
              collection.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
            {filteredStories.map((story) => (
              <div
                key={story._id}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 flex flex-col"
              >
                {/* Story Header */}
                <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-1">
                    {story.name}
                  </h3>
                  <div className="flex gap-1">
                    {story.audioUrl && (
                      <button
                        onClick={() => handlePlayAudio(story)}
                        className={`p-2 rounded-full ${
                          playingId === story._id
                            ? "bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-400"
                            : "bg-purple-100 text-purple-600 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-400"
                        } transition-colors`}
                        title={
                          playingId === story._id
                            ? "Stop playing"
                            : "Play audio"
                        }
                      >
                        {playingId === story._id ? (
                          <FiPause className="w-4 h-4" />
                        ) : (
                          <FiPlay className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {/* <button
                      onClick={() => handleLoadStory(story)}
                      className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-400 transition-colors"
                      title="Load and edit"
                    >
                      <FiEdit className="w-4 h-4" />
                    </button> */}
                  </div>
                </div>

                {/* Story Preview */}
                <div className="p-4 flex-grow">
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 line-clamp-3 min-h-[4.5rem]">
                    {story.content && story.content.substring(0, 200)}
                    {story.content && story.content.length > 200 ? "..." : ""}
                  </div>
                </div>

                {/* Story Footer */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-300 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-3 h-3 opacity-70" />
                    <span>{formatTimestamp(story.createdAt)}</span>
                  </div>

                  {story.audioUrl ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <FiMusic className="mr-1 h-3 w-3" /> With Audio
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      <FiType className="mr-1 h-3 w-3" /> Text Only
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoriesList;
