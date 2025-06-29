import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { FiUser, FiLogOut } from "react-icons/fi";

const UserProfile = () => {
  const { user, logout } = useContext(UserContext);

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
          {!user.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              alt={`${user.firstName}'s profile`}
              className="w-full h-full object-contain"
            />
          ) : (
            <FiUser className="text-white" />
          )}
        </div>
        <span className="font-medium dark:text-white hidden md:block">
          {user.firstName} 
        </span>
      </div>
      <button
        onClick={logout}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        aria-label="Logout"
        title="Logout"
      >
        <FiLogOut className="w-5 h-5" />
      </button>
    </div>
  );
};

export default UserProfile;
