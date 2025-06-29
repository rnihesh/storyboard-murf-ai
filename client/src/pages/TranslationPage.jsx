import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { useUser } from "@clerk/clerk-react";
import { FiGlobe } from "react-icons/fi";
import TranslationPanel from "../components/TranslationPanel";

const TranslationPage = () => {
  const { user: localUser, loading } = useContext(UserContext);
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();

  const user = clerkUser || localUser;

  if (loading || !clerkLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 animate-pulse">
            Loading translation tools...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Translation Studio</h1>
            <p className="text-white/80">
              Translate text and speech into multiple languages
            </p>
          </div>
          <div className="hidden md:block">
            <FiGlobe className="text-4xl text-white/80" />
          </div>
        </div>

        <TranslationPanel />
      </div>
    </div>
  );
};

export default TranslationPage;