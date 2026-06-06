"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, ImageIcon, Link as LinkIcon, Flame, AlertCircle } from "lucide-react";
import { createPost } from "@/lib/actions/posts";

interface Forum {
  id: string;
  name: string;
  slug: string;
}

interface CreatePostBoxProps {
  currentForumId?: string;
  forumsList?: Forum[];
}

export default function CreatePostBox({ currentForumId, forumsList = [] }: CreatePostBoxProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [forums, setForums] = useState<Forum[]>(forumsList);
  const [forumId, setForumId] = useState(currentForumId || "");
  const [type, setType] = useState<"TEXT" | "IMAGE" | "LINK" | "DISCUSSION">("TEXT");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (forumsList.length === 0 && session) {
      const fetchForums = async () => {
        try {
          const res = await fetch("/api/user/forums");
          if (res.ok) {
            const data = await res.json();
            setForums(data.forums || []);
            if (!currentForumId && data.forums.length > 0) {
              setForumId(data.forums[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchForums();
    }
  }, [session, forumsList, currentForumId]);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !forumId) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("content", content.trim());
      formData.append("forumId", forumId);
      formData.append("type", type);
      
      if (type === "IMAGE") {
        formData.append("mediaUrl", mediaUrl.trim());
      } else if (type === "LINK") {
        formData.append("linkUrl", linkUrl.trim());
      }

      const res = await createPost(formData);
      if (res.error) {
        setError(res.error);
      } else {
        setTitle("");
        setContent("");
        setMediaUrl("");
        setLinkUrl("");
        setExpanded(false);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred while creating the post.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="board-container rounded overflow-hidden mb-5">
      <div className="glossy-header text-xs py-1.5 flex items-center justify-between">
        <span className="flex items-center">
          <MessageSquare className="w-3.5 h-3.5 mr-1" /> Start a New Thread Discussion
        </span>
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-[10px] bg-[#337bb5] hover:bg-[#205b8a] text-white px-2 py-0.5 rounded cursor-pointer font-normal border border-[#205b8a]"
          >
            Expand Composer
          </button>
        )}
      </div>

      {expanded ? (
        <form onSubmit={handleSubmit} className="p-3 bg-white dark:bg-[#1b2631] space-y-3">
          {/* Post Type Selector tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setType("TEXT")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border-b-2 font-bold cursor-pointer transition-colors ${
                type === "TEXT"
                  ? "border-[#105289] text-[#105289] dark:text-[#4a90e2] dark:border-[#4a90e2]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Standard Text</span>
            </button>
            <button
              type="button"
              onClick={() => setType("IMAGE")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border-b-2 font-bold cursor-pointer transition-colors ${
                type === "IMAGE"
                  ? "border-[#105289] text-[#105289] dark:text-[#4a90e2] dark:border-[#4a90e2]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Image Post</span>
            </button>
            <button
              type="button"
              onClick={() => setType("LINK")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border-b-2 font-bold cursor-pointer transition-colors ${
                type === "LINK"
                  ? "border-[#105289] text-[#105289] dark:text-[#4a90e2] dark:border-[#4a90e2]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Share Link</span>
            </button>
            <button
              type="button"
              onClick={() => setType("DISCUSSION")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 border-b-2 font-bold cursor-pointer transition-colors ${
                type === "DISCUSSION"
                  ? "border-[#105289] text-[#105289] dark:text-[#4a90e2] dark:border-[#4a90e2]"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Hot Topic</span>
            </button>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Thread Target Community Select */}
            <div className="flex flex-col space-y-1">
              <label className="font-bold text-slate-600 dark:text-slate-400">Target Forum Board:</label>
              {currentForumId ? (
                <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-300 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300">
                  {forumsList.find((f) => f.id === currentForumId)?.name || "Current Subforum"}
                </div>
              ) : (
                <select
                  value={forumId}
                  onChange={(e) => setForumId(e.target.value)}
                  className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289]"
                  required
                >
                  <option value="" disabled>-- Select a forum category --</option>
                  {forums.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Thread title */}
            <div className="flex flex-col space-y-1">
              <label className="font-bold text-slate-600 dark:text-slate-400">Post Title / Topic:</label>
              <input
                type="text"
                placeholder="Enter a descriptive thread title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289]"
                required
              />
            </div>
          </div>

          {/* Type specific URL inputs */}
          {type === "IMAGE" && (
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400">Image URL:</label>
              <input
                type="url"
                placeholder="Paste the link to your PNG/JPG image here..."
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] text-xs"
                required
              />
            </div>
          )}

          {type === "LINK" && (
            <div className="flex flex-col space-y-1 text-xs">
              <label className="font-bold text-slate-600 dark:text-slate-400">Target Website Link:</label>
              <input
                type="url"
                placeholder="Paste standard web address URL (http/https)..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] text-xs"
                required
              />
            </div>
          )}

          {/* Thread content body */}
          <div className="flex flex-col space-y-1 text-xs">
            <label className="font-bold text-slate-600 dark:text-slate-400">Message Content:</label>
            <textarea
              placeholder="Write your main description or question here... BBCode layouts and raw text formatting supported."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-white dark:bg-[#1a2530] text-slate-800 dark:text-slate-200 p-2 rounded border border-slate-400 dark:border-slate-600 focus:outline-none focus:ring-1 focus:ring-[#105289] h-28 shadow-inner"
              required
            />
          </div>

          {/* Error display */}
          {error && (
            <div className="flex items-center space-x-1.5 text-xs text-red-600 font-bold bg-red-50 dark:bg-[#2a1b1b] border border-red-200 dark:border-red-950 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="retro-btn-gray cursor-pointer py-1.5 px-4"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading}
              className="retro-btn-green cursor-pointer py-1.5 px-4"
            >
              {loading ? "Publishing..." : "Submit Thread"}
            </button>
          </div>
        </form>
      ) : (
        <div 
          onClick={() => setExpanded(true)}
          className="p-3.5 bg-slate-50 dark:bg-[#1e2a38] text-slate-500 dark:text-slate-400 text-xs font-semibold cursor-pointer hover:bg-slate-100 dark:hover:bg-[#253344] transition-colors flex items-center space-x-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={session.user.avatarUrl || ""}
            alt="User avatar"
            className="w-6 h-6 retro-avatar p-0.5 mr-1"
          />
          <span>Click here to start a new discussion topic... what is on your mind?</span>
        </div>
      )}
    </div>
  );
}
