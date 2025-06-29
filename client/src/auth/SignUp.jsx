import React from "react";
import { SignUp } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

function Signup() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Create Your Account
      </h1>
      <div className="w-full max-w-md">
        <SignUp
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-500 hover:bg-blue-600 text-white",
              card: "shadow-xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800",
              headerTitle: "text-gray-800 dark:text-white font-bold",
              formFieldInput:
                "dark:bg-gray-700 dark:text-white dark:border-gray-600",
              formFieldLabel: "dark:text-gray-300",
              footerActionLink:
                "text-blue-500 hover:text-blue-600 dark:text-blue-400",
              socialButtonsBlockButton:
                "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
              identityPreviewText: "dark:text-gray-300",
            },
          }}
          redirectUrl="/"
          fallbackRedirectUrl="/"
          signInUrl="/signin"
          routing="path"
          path="/signup"
        />
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/signin" className="text-blue-500 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
