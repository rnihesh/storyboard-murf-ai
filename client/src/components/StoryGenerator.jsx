import { useState, useContext } from "react";
import {
  FiSend,
  FiZap,
  FiMessageSquare,
  FiGift,
  FiCpu,
  FiFeather,
  FiPenTool,
} from "react-icons/fi";
import { StoryContext } from "../contexts/StoryContext";

const StoryGenerator = () => {
  const { generateStory, generating } = useContext(StoryContext);
  const [prompt, setPrompt] = useState("");
  const [showPromptIdeas, setShowPromptIdeas] = useState(false);

  const promptIdeas = [
    "A time traveler accidentally changes a pivotal historical moment",
    "A detective who can communicate with houseplants solves mysteries",
    "A chef discovers their food can alter people's emotions",
    "A librarian finds a book that predicts the future",
    "A magical forest where the trees change colors based on human emotions",
    "A spaceship crew discovers an abandoned alien vessel with a surprising passenger",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || generating) return;

    try {
      await generateStory(prompt);
    } catch (error) {
      console.error("Error generating story:", error);
    }
  };

  const usePromptIdea = (idea) => {
    setPrompt(idea);
    setShowPromptIdeas(false);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
          <FiFeather className="text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          Describe a story idea and let AI create a short story for you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div className="mb-4 relative">
          <textarea
            id="prompt"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your story idea here..."
            className="w-full p-3 pl-4 pr-10 border border-amber-200 dark:border-amber-800/30 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
            disabled={generating}
          />

          <button
            type="button"
            onClick={() => setShowPromptIdeas(!showPromptIdeas)}
            className="absolute right-3 top-3 p-1.5 text-amber-600 hover:text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors"
            title="Get prompt ideas"
          >
            <FiZap size={16} />
          </button>
        </div>

        {/* Prompt ideas dropdown */}
        {showPromptIdeas && (
          <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-fade-in-up">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2 mb-1">
              <FiPenTool className="text-amber-500" />
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Story Prompt Ideas
              </h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {promptIdeas.map((idea, index) => (
                <div
                  key={index}
                  onClick={() => usePromptIdea(idea)}
                  className="px-4 py-2.5 hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer text-gray-800 dark:text-gray-200 transition-colors flex items-center gap-2"
                >
                  <FiMessageSquare
                    className="text-amber-500 flex-shrink-0"
                    size={14}
                  />
                  <span className="text-sm">{idea}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!prompt.trim() || generating}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed transform hover:translate-y-[-1px] active:translate-y-[1px]"
        >
          {generating ? (
            <>
              <span className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></span>
              <span>Generating your story...</span>
            </>
          ) : (
            <>
              <FiCpu />
              <span>Generate Story</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <FiGift className="text-amber-500" />
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tips
          </h3>
        </div>
        <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <span>Be specific about settings, characters, and tone</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <span>Include a genre (fantasy, mystery, romance, etc.)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 font-bold">•</span>
            <span>Specify length (short story, flash fiction, etc.)</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default StoryGenerator;
