"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, User, Send, ArrowRight, PlusCircle, Inbox } from "lucide-react";
import { sendPrivateMessage, markMessagesAsRead } from "@/lib/actions/messages";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

interface Thread {
  user: { id: string; username: string; avatarUrl: string | null };
  messages: Message[];
  unreadCount: number;
}

interface DirectMessagesProps {
  threads: Thread[];
  currentUserId: string;
  initialUser: string;
}

export default function DirectMessages({ threads, currentUserId, initialUser }: DirectMessagesProps) {
  const router = useRouter();
  const [activeThreadUser, setActiveThreadUser] = useState<string | null>(initialUser || (threads.length > 0 ? threads[0].user.username : null));
  const [typedMessage, setTypedMessage] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const activeThread = threads.find((t) => t.user.username === activeThreadUser);

  // Mark active messages as read on view load
  useEffect(() => {
    if (activeThread && activeThread.unreadCount > 0) {
      markMessagesAsRead(activeThread.user.id);
    }
  }, [activeThread]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !activeThreadUser) return;
    setSending(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("receiverUsername", activeThreadUser);
      formData.append("content", typedMessage.trim());

      const res = await sendPrivateMessage(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setTypedMessage("");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleStartNewThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim()) return;
    setError("");

    // Verify recipient username exists in standard list or try to send first message
    try {
      // Set recipient username as active thread username
      setActiveThreadUser(newRecipient.trim());
      setNewRecipient("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[420px] bg-white dark:bg-[#1b2631] divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 text-xs">
      
      {/* 1. Threads Sidebar (Left panel) */}
      <div className="w-full md:w-48 flex flex-col flex-shrink-0 bg-slate-50 dark:bg-[#1a2530] overflow-y-auto">
        <div className="p-2 border-b border-slate-200 dark:border-slate-800 glossy-header-sub font-bold text-center flex items-center justify-between text-[#105289]">
          <span>Folder Inbox</span>
          <Inbox className="w-3.5 h-3.5" />
        </div>
        
        {/* New message thread row */}
        <form onSubmit={handleStartNewThread} className="p-2 border-b border-slate-200 dark:border-slate-800 flex items-center space-x-1">
          <input
            type="text"
            placeholder="New chat username..."
            value={newRecipient}
            onChange={(e) => setNewRecipient(e.target.value)}
            className="w-full text-[10px] p-1.5 bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 rounded border border-slate-400 dark:border-slate-600 focus:outline-none"
            required
          />
          <button type="submit" className="retro-btn-green py-1 px-1.5 text-[9px]">
            <PlusCircle className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* List of active threads */}
        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
          {threads.length > 0 ? (
            threads.map((t) => (
              <button
                key={t.user.id}
                onClick={() => {
                  setActiveThreadUser(t.user.username);
                  setError("");
                }}
                className={`w-full flex items-center space-x-2 p-2.5 hover:bg-[#e6eff6] dark:hover:bg-[#223141] text-left transition-colors cursor-pointer ${
                  activeThreadUser === t.user.username ? "bg-[#e6eff6] dark:bg-[#223141] border-l-2 border-[#105289]" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={t.user.avatarUrl || "https://api.dicebear.com/7.x/pixel-art/svg?seed=fallback"}
                  alt={t.user.username}
                  className="w-6 h-6 rounded bg-slate-100 p-0.5 border border-slate-300 flex-shrink-0"
                />
                <div className="truncate flex-1">
                  <span className="font-bold text-slate-700 dark:text-slate-200 block truncate">{t.user.username}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {t.messages[t.messages.length - 1]?.content || "No DMs"}
                  </span>
                </div>
                {t.unreadCount > 0 && (
                  <span className="bg-red-600 text-white font-bold px-1 py-0.5 rounded text-[8px] leading-none flex-shrink-0">
                    {t.unreadCount}
                  </span>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-slate-500 italic text-[10px]">
              Your private inbox folder is empty!
            </div>
          )}
        </div>
      </div>

      {/* 2. Message History (Right panel) */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1b2631]">
        {activeThreadUser ? (
          <>
            {/* Active partner banner */}
            <div className="glossy-header-sub p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-[#105289]">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-[#105289]" />
                <span className="font-bold">Conversation with: <strong className="underline">{activeThreadUser}</strong></span>
              </div>
              <span className="text-[9px] retro-badge badge-online">active online</span>
            </div>

            {/* DM lists */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50/50 dark:bg-[#161f28]">
              {activeThread && activeThread.messages.length > 0 ? (
                activeThread.messages.map((m) => {
                  const isSender = m.senderId === currentUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isSender ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] p-2 rounded shadow-sm border ${
                          isSender
                            ? "bg-[#e3effa] border-[#b8d2ea] text-slate-800 rounded-br-none"
                            : "bg-white dark:bg-[#202d3c] border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-tight text-[11px] font-mono">{m.content}</p>
                        <span className="text-[8px] text-slate-400 block mt-1 text-right">
                          {new Date(m.createdAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12 space-y-1">
                  <MessageSquare className="w-6 h-6 text-slate-300" />
                  <p className="italic text-[10px]">No messages exchanged yet. Send a DM below to initiate the chat!</p>
                </div>
              )}
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-3 mt-1.5 p-1 bg-red-50 dark:bg-[#2a1b1b] border border-red-200 text-red-600 font-semibold text-[10px] text-center rounded flex items-center justify-center space-x-1">
                <span>{error}</span>
              </div>
            )}

            {/* Text Composer */}
            <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-2 bg-white dark:bg-[#1b2631]">
              <input
                type="text"
                placeholder="Type your secure private message here..."
                value={typedMessage}
                onChange={(e) => setTypedMessage(e.target.value)}
                className="w-full p-2 bg-slate-50 dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 rounded border border-slate-400 dark:border-slate-600 focus:outline-none text-xs shadow-inner focus:bg-white"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="retro-btn-green py-2 px-3 flex-shrink-0 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-1.5">
            <Inbox className="w-10 h-10 text-slate-300" />
            <span className="font-bold text-slate-600 dark:text-slate-400">No active discussion chosen</span>
            <p className="text-[10px] italic">Choose an active inbox member thread on the left, or enter a username to start a discussion.</p>
          </div>
        )}
      </div>

    </div>
  );
}
