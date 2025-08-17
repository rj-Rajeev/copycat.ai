"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  Bot,
  Code,
  Search,
  Menu,
  X,
  User,
  ExternalLink,
  Download,
  Plus,
  Moon,
  Sun,
  Settings,
  MoreHorizontal,
  Sparkles
} from "lucide-react";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { useRouter } from "next/navigation";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  extra?: {
    previewUrl?: string;
    zipUrl?: string;
  };
}

interface ChatSession {
  _id: string;
  title: string;
  lastMessage: string;
  updatedAt: string;
  messages: { role: string; content: string; timestamp: string }[];
}

interface Agent {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const agents: Agent[] = [
  {
    id: "general",
    name: "General Assistant",
    icon: <Sparkles size={18} />,
    description: "General purpose AI assistant",
  },
  {
    id: "code",
    name: "Code Helper",
    icon: <Code size={18} />,
    description: "Programming and development support",
  },
  {
    id: "research",
    name: "Research Agent",
    icon: <Search size={18} />,
    description: "Research and information gathering",
  },
];

const ChatApp: React.FC = () => {
  const [isDark, setIsDark] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeAgent, setActiveAgent] = useState(agents[0]);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue]);

  // scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // load user + chats
  useEffect(() => {
    const loadChats = async () => {
      let userId = localStorage.getItem("copycat_user_id");

      if (!userId) {
        const res = await fetch("/api/chat/new", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: "init" }),
        });
        const data = await res.json();
        if (data.userId) {
          userId = data.userId;
          localStorage.setItem("copycat_user_id", userId || "");
        }
      }

      if (userId) {
        const res = await fetch(`/api/chat/history/${userId}`);
        const data = await res.json();
        if (data.success) {
          setChatSessions(data.chats);

          if (data.chats.length > 0) {
            setCurrentChat(data.chats[0]); // open latest
            setMessages(
              data.chats[0].messages.map((m: any, idx: number) => ({
                id: idx.toString(),
                content: m.content,
                isUser: m.role === "user",
                timestamp: new Date(m.timestamp),
              }))
            );
          }
        }
      }
    };

    loadChats();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: currentChat._id,
          prompt: userMessage.content,
          agentId: activeAgent.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content: data.reply,
          isUser: false,
          timestamp: new Date(),
          extra: data.extra || undefined,
        };
        setMessages((prev) => [...prev, aiResponse]);
      } else {
        const errorResponse: Message = {
          id: (Date.now() + 2).toString(),
          content: "⚠️ Failed to get AI response.",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorResponse]);
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectChat = (session: ChatSession) => {
    setCurrentChat(session);
    setMessages(
      session.messages.map((m, idx) => ({
        id: idx.toString(),
        content: m.content,
        isUser: m.role === "user",
        timestamp: new Date(m.timestamp),
      }))
    );
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const formatSessionTime = (date: string) => {
    if (!date) return "Unknown";

    const d = new Date(date);
    if (isNaN(d.getTime())) return "Unknown";

    const now = new Date();
    const diff = now.getTime() - d.getTime();

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;

    return d.toLocaleDateString();
  };

  const handleNewChat = async () => {
    try {
      const userId = localStorage.getItem("copycat_user_id");
      const res = await fetch("/api/chat/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            role: "assistant",
            content: "Hi, how can I help you?",
          }, // initial msg
          userId: userId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // ✅ update localStorage if new user created
        if (data.userId && data.userId !== userId) {
          localStorage.setItem("copycat_user_id", data.userId);
        }
        router.push(`/chat/${data.chat._id}`);
      }
    } catch (err) {
      console.error("New chat error:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`${isDark ? "dark" : ""} h-screen flex overflow-hidden bg-white dark:bg-black`}>
      <div className="flex w-full text-gray-900 dark:text-gray-100">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } fixed lg:relative lg:translate-x-0 z-30 w-80 h-full bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col`}
        >
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                AI Chat
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDark(!isDark)}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                  title="Toggle theme"
                >
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 p-3 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Agent Selector */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <button
                onClick={() => setShowAgentSelector(!showAgentSelector)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  {activeAgent.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{activeAgent.name}</div>
                  <div className="text-xs text-gray-500">{activeAgent.description}</div>
                </div>
                <MoreHorizontal size={16} className="text-gray-400" />
              </button>

              {showAgentSelector && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg z-50">
                  {agents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => {
                        setActiveAgent(agent);
                        setShowAgentSelector(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        activeAgent.id === agent.id ? 'bg-gray-50 dark:bg-gray-900' : ''
                      }`}
                    >
                      <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                        {agent.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {chatSessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => handleSelectChat(session)}
                  className={`group w-full text-left p-3 rounded-xl transition-all duration-200 ${
                    currentChat?._id === session._id
                      ? "bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
                      : "hover:bg-gray-50 dark:hover:bg-gray-950"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg mt-0.5">
                      <MessageSquare size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate mb-1">
                        {session.title || "Untitled Chat"}
                      </div>
                      <div className="text-xs text-gray-500 truncate mb-2">
                        {session.lastMessage}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatSessionTime(session.updatedAt)}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
              >
                <Menu size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-900 rounded-lg">
                  {activeAgent.icon}
                </div>
                <div>
                  <div className="font-semibold">{currentChat?.title || "New Chat"}</div>
                  <div className="text-sm text-gray-500">{activeAgent.name}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <Settings size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-4 ${m.isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      m.isUser
                        ? "bg-black dark:bg-white text-white dark:text-black"
                        : "bg-gray-100 dark:bg-gray-900"
                    }`}
                  >
                    {m.isUser ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className={`flex-1 ${m.isUser ? "text-right" : ""}`}>
                    <div
                      className={`inline-block max-w-[80%] px-4 py-3 rounded-2xl ${
                        m.isUser
                          ? "bg-black dark:bg-white text-white dark:text-black"
                          : "bg-gray-100 dark:bg-gray-900"
                      }`}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                      >
                        {m.content}
                      </ReactMarkdown>
                      
                      {/* Extra content (preview/download links) */}
                      {m.extra && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                          {m.extra.previewUrl && (
                            <a
                              href={m.extra.previewUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <ExternalLink size={14} />
                              Preview
                            </a>
                          )}
                          {m.extra.zipUrl && (
                            <a
                              href={m.extra.zipUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <Download size={14} />
                              Download
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      {formatTime(m.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                    <Bot size={18} />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-gray-100 dark:bg-gray-900 px-4 py-3 rounded-2xl">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-end gap-3 p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 focus-within:border-gray-300 dark:focus-within:border-gray-700 transition-colors">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Message ${activeAgent.name}...`}
                  className="flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] min-h-[24px] placeholder:text-gray-400"
                  rows={1}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="p-2 bg-black dark:bg-white text-white dark:text-black rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3 px-1">
                <div className="text-xs text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <div className="text-xs text-gray-400">
                  {inputValue.length} characters
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;