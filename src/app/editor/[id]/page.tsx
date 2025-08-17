"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Editor from "@monaco-editor/react";
import {
  Sun,
  Moon,
  Save,
  Download,
  RefreshCw,
  Code,
  Eye,
  Maximize2,
  Minimize2,
} from "lucide-react";

export default function EditorPage() {
  const [code, setCode] = useState("");
  const [previewKey, setPreviewKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [activeTab, setActiveTab] = useState("editor");

  const params = useParams();
  const siteId = params?.id as string;

  useEffect(() => {
    if (!siteId) return;
    setIsLoading(true);
    fetch(`/cloned-sites/${siteId}/index.html`)
      .then((res) => res.text())
      .then((data) => {
        setCode(data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [siteId]);

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      if (code && !isLoading && !isSaving) {
        handleAutoSave();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [code]);

  const handleAutoSave = async () => {
    if (!siteId || !code) return;
    try {
      await fetch(`/api/save-html?id=${siteId}`, {
        method: "POST",
        body: JSON.stringify({ html: code }),
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
    }
  };

  const handleSave = async () => {
    if (!siteId) return;
    setIsSaving(true);
    try {
      await fetch(`/api/save-html?id=${siteId}`, {
        method: "POST",
        body: JSON.stringify({ html: code }),
        headers: { "Content-Type": "application/json" },
      });
      setPreviewKey((k) => k + 1);
      setLastSaved(new Date());
    } catch (error) {
      console.error("Save failed:", error);
    }
    setIsSaving(false);
  };

  const handleDownload = () => {
    if (!siteId) return;
    const url = `/api/download-zip?dir=${encodeURIComponent(
      `./public/cloned-sites/${siteId}`
    )}`;
    window.open(url, "_blank");
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const refreshPreview = () => {
    setPreviewKey((k) => k + 1);
  };

  const toggleFullPreview = () => {
    setIsFullPreview(!isFullPreview);
  };

  return (
    <div
      className={`h-screen flex flex-col ${isDarkMode ? "bg-black text-white" : "bg-white text-black"} transition-colors duration-200`}
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-3 border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
      >
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold">Code Editor</h1>
          <span
            className={`text-sm px-3 py-1 rounded-full ${isDarkMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}
          >
            Site ID: {siteId}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {lastSaved && (
            <span
              className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              Last saved: {lastSaved.toLocaleTimeString()}
            </span>
          )}

          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Toggle theme"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={toggleFullPreview}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode
                ? "hover:bg-gray-800 text-gray-300"
                : "hover:bg-gray-100 text-gray-600"
            }`}
            title="Toggle full preview"
          >
            {isFullPreview ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile tabs */}
      <div
        className={`md:hidden flex border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <button
          onClick={() => setActiveTab("editor")}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === "editor"
              ? isDarkMode
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-black"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-600"
          }`}
        >
          <Code size={16} />
          <span>Editor</span>
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`flex-1 py-3 px-4 text-sm font-medium flex items-center justify-center space-x-2 ${
            activeTab === "preview"
              ? isDarkMode
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-black"
              : isDarkMode
                ? "text-gray-400"
                : "text-gray-600"
          }`}
        >
          <Eye size={16} />
          <span>Preview</span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Left side: Editor */}
        <div
          className={`${isFullPreview ? "hidden" : "w-full md:w-1/2"} ${activeTab === "preview" ? "hidden md:flex" : "flex"} flex-col border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="html"
              theme={isDarkMode ? "vs-dark" : "light"}
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                wordWrap: "on",
                automaticLayout: true,
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                folding: true,
                bracketPairColorization: { enabled: true },
              }}
            />
          )}

          {/* Editor controls */}
          <div
            className={`flex border-t ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
          >
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                isSaving
                  ? isDarkMode
                    ? "bg-gray-700 text-gray-500"
                    : "bg-gray-200 text-gray-400"
                  : isDarkMode
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isSaving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              <span>{isSaving ? "Saving..." : "Save & Refresh"}</span>
            </button>

            <button
              onClick={handleDownload}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                isDarkMode
                  ? "bg-green-600 hover:bg-green-700 text-white border-l border-gray-700"
                  : "bg-green-500 hover:bg-green-600 text-white border-l border-gray-300"
              }`}
            >
              <Download size={16} />
              <span>Download ZIP</span>
            </button>
          </div>
        </div>

        {/* Right side: Live Preview */}
        <div
          className={`${isFullPreview ? "w-full" : "w-full md:w-1/2"} ${activeTab === "editor" ? "hidden md:flex" : "flex"} flex-col`}
        >
          {/* Preview header */}
          <div
            className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-gray-50"}`}
          >
            <span
              className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
            >
              Live Preview
            </span>
            <button
              onClick={refreshPreview}
              className={`p-1 rounded transition-colors ${
                isDarkMode
                  ? "hover:bg-gray-800 text-gray-400"
                  : "hover:bg-gray-200 text-gray-600"
              }`}
              title="Refresh preview"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {/* Preview iframe */}
          <div className="flex-1 relative">
            <iframe
              key={previewKey}
              src={`/cloned-sites/${siteId}/index.html`}
              className="w-full h-full border-0"
              title="Live Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
