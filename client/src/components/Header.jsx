import { useContext } from "react";
import { FiBook, FiHome, FiBookOpen, FiGlobe } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import { UserContext } from "../contexts/UserContext";
import { useClerk, useUser } from "@clerk/clerk-react";

const Header = () => {
  const { user: localUser } = useContext(UserContext);
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    // Also handle local user logout if needed
    if (localUser) {
      const { logout } = useContext(UserContext);
      logout();
    }
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 m-4 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link
              to="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <FiBook className="w-6 h-6 text-blue-500" />
              <span className="ml-2 text-xl font-semibold dark:text-white">
                StoryBoard
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <FiHome className="mr-2" />
                Home
              </Link>
              <Link
                to="/my-stories"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <FiBookOpen className="mr-2" />
                My History
              </Link>
              <Link
                to="/translate"
                className="flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                <FiGlobe className="mr-2" />
                Translate
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* <ThemeSwitcher /> */}
            {clerkUser ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {clerkUser.profileImageUrl ? (
                    <img
                      src={clerkUser.profileImageUrl}
                      alt="Profile"
                      className="w-8 h-8 rounded-full border-2 border-blue-300"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {clerkUser.firstName?.charAt(0) || "U"}
                      </span>
                    </div>
                  )}
                  <span className="font-medium dark:text-white hidden md:block">
                    {clerkUser.firstName || "User"}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/signin"
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="px-3 py-1 text-sm border border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
