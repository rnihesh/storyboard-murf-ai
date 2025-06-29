import { useState, useEffect, useRef } from "react";
import {
  FiPlay,
  FiPause,
  FiDownload,
  FiSkipBack,
  FiSkipForward,
  FiVolume2,
  FiVolumeX,
} from "react-icons/fi";

const AudioPlayer = ({ audioUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioElement, setAudioElement] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const progressRef = useRef(null);

  // Initialize audio element when audioUrl changes
  useEffect(() => {
    if (audioUrl) {
      setIsLoading(true);
      const audio = new Audio(audioUrl);

      audio.addEventListener("timeupdate", () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        setProgress(percent);
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
        setIsLoading(false);
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      });

      audio.addEventListener("canplaythrough", () => {
        setIsLoading(false);
      });

      audio.addEventListener("error", () => {
        setIsLoading(false);
        console.error("Error loading audio");
      });

      // Set the volume
      audio.volume = volume;

      setAudioElement(audio);

      // Clean up on unmount
      return () => {
        audio.pause();
        audio.src = "";
        audio.remove();
      };
    }
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioElement || isLoading) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play().catch((error) => {
        console.error("Error playing audio:", error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (e) => {
    if (!audioElement || isLoading) return;

    const newTime =
      (e.nativeEvent.offsetX / progressRef.current.offsetWidth) * duration;
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleSkip = (seconds) => {
    if (!audioElement || isLoading) return;

    const newTime = Math.max(
      0,
      Math.min(audioElement.currentTime + seconds, duration)
    );
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress((newTime / duration) * 100);
  };

  const handleVolumeChange = (e) => {
    if (!audioElement) return;

    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioElement.volume = newVolume;

    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioElement) return;

    if (isMuted) {
      audioElement.volume = volume === 0 ? 0.5 : volume;
      setVolume(volume === 0 ? 0.5 : volume);
      setIsMuted(false);
    } else {
      audioElement.volume = 0;
      setIsMuted(true);
    }
  };

  // Format time in MM:SS
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
  };

  // If no audio URL is provided, don't render the player
  if (!audioUrl) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Progress bar */}
      <div
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 cursor-pointer relative group"
        onClick={handleProgressChange}
        ref={progressRef}
      >
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700"
          style={{ width: `${progress}%` }}
        ></div>
        <div
          className="absolute top-0 h-full pointer-events-none hidden group-hover:block opacity-30 transition-opacity"
          style={{
            left: `${progress}%`,
            width: "1px",
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(255, 255, 255, 0.8)",
          }}
        ></div>
      </div>

      {/* Controls */}
      <div className="p-3 flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => handleSkip(-10)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={isLoading}
            title="Back 10 seconds"
          >
            <FiSkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlayPause}
            className={`w-12 h-12 flex items-center justify-center rounded-full ${
              isLoading
                ? "bg-gray-200 dark:bg-gray-700 cursor-not-allowed"
                : "bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white shadow-md hover:shadow-lg"
            } transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading w-5 h-5 border-2 border-t-transparent border-indigo-300 rounded-full animate-spin"></span>
            ) : isPlaying ? (
              <FiPause className="w-6 h-6" />
            ) : (
              <FiPlay className="w-6 h-6 ml-1" />
            )}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={isLoading}
            title="Forward 10 seconds"
          >
            <FiSkipForward className="w-5 h-5" />
          </button>

          <div className="text-sm text-gray-600 dark:text-gray-300 min-w-[70px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={toggleMute}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            {isMuted ? (
              <FiVolumeX className="w-5 h-5" />
            ) : (
              <FiVolume2 className="w-5 h-5" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-2 w-20 md:w-32 appearance-none bg-gray-200 dark:bg-gray-700 rounded-full accent-indigo-600"
          />

          <a
            href={audioUrl}
            download
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors ml-2"
            title="Download audio"
          >
            <FiDownload className="w-5 h-5" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
