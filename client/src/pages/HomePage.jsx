import { useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useUser } from "@clerk/clerk-react";
import StoryGenerator from "../components/StoryGenerator";
import StoryEditor from "../components/StoryEditor";
import StoriesList from "../components/StoriesList";
import {
  FiBookOpen,
  FiHeadphones,
  FiFeather,
  FiCpu,
  FiEdit,
  FiPlay,
  FiSave,
} from "react-icons/fi";

const HomePage = () => {
  const { user: localUser, loading } = useContext(UserContext);
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();

  const user = clerkUser || localUser;

  if (loading || !clerkLoaded) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">
            Loading your creative space...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {!isSignedIn ? (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] p-6">
          <div className="text-center max-w-4xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-white/20 dark:border-gray-700/30">
            <FiFeather className="text-5xl mx-auto text-blue-500 dark:text-blue-400 mb-6" />
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
              StoryBoard
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
              Create engaging stories, convert them to natural-sounding speech,
              and build your personal story library — all in one place
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <FiCpu className="text-blue-600 dark:text-blue-400 text-xl" />
                <span className="font-medium text-gray-800 dark:text-gray-200">AI-Powered Creation</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <FiEdit className="text-indigo-600 dark:text-indigo-400 text-xl" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Easy Editing</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-full bg-white dark:bg-gray-800 shadow-md border border-gray-200 dark:border-gray-700">
                <FiHeadphones className="text-purple-600 dark:text-purple-400 text-xl" />
                <span className="font-medium text-gray-800 dark:text-gray-200">Text-to-Speech</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-full shadow-md hover:shadow-lg transition-all"
              >
                Sign Up Free
              </Link>
              <Link
                to="/signin"
                className="px-8 py-3 bg-white dark:bg-gray-800 text-blue-500 font-medium rounded-full shadow-md hover:shadow-lg border border-blue-300 dark:border-gray-700 transition-all"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">
                  Welcome back, {user.firstName || "Creator"}!
                </h1>
                <p className="text-white/80">
                  Create stories, add audio narration, or browse your collection
                </p>
              </div>
              <div className="hidden md:block">
                <FiFeather className="text-4xl text-white/80" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center gap-2">
                    <FiBookOpen className="text-white text-lg" />
                    <h2 className="text-lg font-medium text-white">Generate Story</h2>
                  </div>
                  <div className="p-4">
                    <StoryGenerator />
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center gap-2">
                    {/* <FiSave className="text-white text-lg" />
                    <h2 className="text-lg font-medium text-white">My Stories</h2> */}
                  </div>
                  <div className="p-4">
                    <StoriesList />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 flex items-center gap-2">
                    {/* <FiEdit className="text-white text-lg" /> */}
                    {/* <h2 className="text-lg font-medium text-white">Story Editor</h2> */}
                  </div>
                  <div className="p-4">
                    <StoryEditor />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
