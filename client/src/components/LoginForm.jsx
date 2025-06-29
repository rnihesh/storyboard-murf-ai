import { useState, useContext } from "react";
import { FiMail, FiUser } from "react-icons/fi";
import { UserContext } from "../contexts/UserContext";

const LoginForm = () => {
  const { login } = useContext(UserContext);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!formData.firstName || !formData.email) {
      setError("First name and email are required");
      return;
    }

    if (!isValidEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await login(formData);
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred while logging in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
      <h1 className="text-2xl font-bold mb-6 dark:text-white">
        Welcome to Storyboard
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-1 dark:text-gray-300"
            >
              First Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <FiUser />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className="w-full pl-10 p-2.5 border rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1 dark:text-gray-300"
            >
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <FiUser />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className="w-full pl-10 p-2.5 border rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-1 dark:text-gray-300"
            >
              Email Address *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <FiMail />
              </div>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full pl-10 p-2.5 border rounded-md bg-white dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full mt-6 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
              <span>Logging in...</span>
            </span>
          ) : (
            "Log In / Sign Up"
          )}
        </button>
      </form>

      <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
        New users will be automatically registered.
        <br />
        Existing users will be logged in.
      </p>
    </div>
  );
};

export default LoginForm;
