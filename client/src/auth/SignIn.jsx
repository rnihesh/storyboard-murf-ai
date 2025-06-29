import React from "react";
import { SignIn } from "@clerk/clerk-react";
import { Link } from "react-router-dom";

function Signin() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Welcome Back!
      </h1>
      <div className="w-full max-w-md">
        <SignIn
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
              identityPreviewText: "dark:text-gray-300",
            },
          }}
          redirectUrl="/"
          fallbackRedirectUrl="/"
          signUpUrl="/signup"
          routing="path"
          path="/signin"
        />
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-600 dark:text-gray-300">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-500 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signin;
