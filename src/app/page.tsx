"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Moon,
  Sun,
  Bot,
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
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex flex-col">
        
        {/* Header */}
        <header className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            CopyCat
          </h1>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
          {/* Assistant Avatar */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg mb-6">
            <Bot className="w-14 h-14 text-white" />
          </div>

          {/* Assistant Greeting */}
          <h2 className="text-3xl font-bold mb-2">Hi, how can I help you?</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg">
            I’m CopyCat, your AI assistant for coding, design, and more.
          </p>

          {/* New Chat Button */}
          <button
            onClick={startNewChat}
            className="px-6 py-3 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold text-lg shadow-lg hover:scale-105 transition-transform"
          >
            <Plus className="w-5 h-5" />
            Start New Chat
          </button>

          {/* Decorative Wave */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-purple-600/10 to-transparent pointer-events-none"></div>
        </main>
      </div>
    </div>
  );
};

export default CopyCatLandingPage;
