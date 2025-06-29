import { createContext, useState, useEffect } from "react";
import { userApi } from "../services/api";
import { useUser } from "@clerk/clerk-react";

export const UserContext = createContext({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();

  useEffect(() => {
    // Check for saved user in localStorage
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Sync Clerk user with our local user state
  useEffect(() => {
    if (clerkLoaded && clerkUser) {
      const userToSync = {
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName || "",
        email: clerkUser.primaryEmailAddress?.emailAddress,
        profileImageUrl: clerkUser.profileImageUrl,
        id: clerkUser.id,
      };

      // If we have a Clerk user but no local user, sync them
      syncUserWithBackend(userToSync);
    }
  }, [clerkUser, clerkLoaded]);

  const syncUserWithBackend = async (userData) => {
    try {
      if (!userData) return;

      setLoading(true);
      const response = await userApi.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName || "",
        email: userData.email,
      });

      // Save user to state and localStorage
      const newUser = response.payload;
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("User sync error:", error);
      // Don't throw here, just log the error and continue
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    try {
      setLoading(true);
      const response = await userApi.createUser({
        firstName: userData.firstName,
        lastName: userData.lastName || "",
        email: userData.email,
      });

      // Save user to state and localStorage
      const newUser = response.payload;
      localStorage.setItem("user", JSON.stringify(newUser));
      setUser(newUser);
      return newUser;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
