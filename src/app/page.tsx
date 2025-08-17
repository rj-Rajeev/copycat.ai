"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Moon,
  Sun,
  Bot,
  Code,
  Eye,
  Download,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { generateObjectId } from "@/utils/generateObjectId";
import { useRouter } from "next/navigation";

const CopyCatLandingPage: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    let storedId = localStorage.getItem("copycat_user_id");
    if (!storedId) {
      storedId = generateObjectId();
      localStorage.setItem("copycat_user_id", storedId);
    }
    setUserId(storedId);
  }, []);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    setIsDarkMode(savedDarkMode);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", isDarkMode.toString());
  }, [isDarkMode]);

  const startNewChat = async () => {
    try {
      const res = await fetch("/api/chat/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: {
            role: "assistant",
            content: "Hi, how can I help you?",
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/chat/${data.chat._id}`);
      }
    } catch (error) {
      console.error("Error creating new chat:", error);
    }
  };

  return (
    <div
      className={`h-screen overflow-hidden transition-all duration-300 ${isDarkMode ? "dark" : ""}`}
    >
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950 text-gray-900 dark:text-gray-100 relative overflow-hidden flex flex-col">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-300/20 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-pink-300/20 dark:bg-pink-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-blue-300/20 dark:bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        {/* Header */}
        <header className="relative z-10 p-4 border-b border-white/20 dark:border-gray-700/50 backdrop-blur-sm flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
              CopyCat
            </h1>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-gray-700/50 transition-all duration-200 backdrop-blur-sm border border-white/20 dark:border-gray-600/50"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-600" />
            )}
          </button>
        </header>

        {/* Main Content */}
        <main className="relative z-10 flex-1 flex items-center justify-center px-6">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Hero Content */}
              <div className="text-center lg:text-left">
                {/* AI Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700/50 mb-6 backdrop-blur-sm">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    AI-Powered UI Cloning
                  </span>
                </div>

                {/* Main Heading */}
                <h2 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                    Clone Any
                  </span>
                  <br />
                  <span className="text-gray-900 dark:text-white">
                    Website UI
                  </span>
                </h2>

                {/* Subtitle */}
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                  Transform any webpage into clean, editable code with instant
                  preview,
                  <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    {" "}
                    code editor, and downloadable ZIP files.
                  </span>
                </p>

                {/* CTA Button */}
                <button
                  onClick={startNewChat}
                  className="group px-8 py-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-lg shadow-2xl hover:shadow-purple-500/25 hover:scale-105 transition-all duration-300 relative overflow-hidden mx-auto lg:mx-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Start Cloning</span>
                  <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>

              {/* Right Side - Features */}
              <div className="space-y-6">
                {/* Feature 1 */}
                <div className="group flex items-start gap-4 p-4 rounded-xl bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                      Instant Preview
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      See your cloned UI come to life in real-time with our live
                      preview feature
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="group flex items-start gap-4 p-4 rounded-xl bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                      Code Editor
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Advanced code editor with syntax highlighting and
                      intelligent suggestions
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="group flex items-start gap-4 p-4 rounded-xl bg-white/10 dark:bg-gray-800/20 backdrop-blur-sm border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-700/30 transition-all duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-pink-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Download className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                      Download Ready
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      Get your complete project as a downloadable ZIP file
                      instantly
                    </p>
                  </div>
                </div>

                {/* AI Process Indicator */}
                <div className="flex items-center justify-center gap-2 mt-8 text-sm text-gray-500 dark:text-gray-400">
                  <Zap className="w-4 h-4 text-purple-500" />
                  <span>Created by @RajeevBhrdwaj</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer Gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-purple-600/5 to-transparent pointer-events-none"></div>
      </div>
    </div>
  );
};

export default CopyCatLandingPage;
