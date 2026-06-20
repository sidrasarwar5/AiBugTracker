"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { sendChatMessage, type ChatMessage } from "@/lib/ai";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await sendChatMessage(trimmed, conversationId);
      setConversationId(response.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: response.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-lg transition-transform hover:scale-105"
          aria-label="Open chat"
        >
          💬
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-5 right-5 z-50 flex h-125 w-[90vw] max-w-sm flex-col rounded-lg border border-line bg-white shadow-xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-medium text-ink">Bug Tracker Assistant</p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-ink-soft hover:text-ink"
              aria-label="Close chat"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-sm text-ink-soft">
                  Ask me about your bugs, projects, or status updates.
                </p>
                <div className="mt-2 flex flex-col gap-1.5 text-xs">
                  <button
                    onClick={() => setInput("What bugs are assigned to me?")}
                    className="rounded-full border border-line px-3 py-1 text-ink-soft hover:bg-ink/5"
                  >
                    What bugs are assigned to me?
                  </button>
                  <button
                    onClick={() => setInput("How many open bugs do we have?")}
                    className="rounded-full border border-line px-3 py-1 text-ink-soft hover:bg-ink/5"
                  >
                    How many open bugs do we have?
                  </button>
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-ink text-white"
                      : "bg-ink/5 text-ink"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="mb-3 flex justify-start">
                <div className="rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink-soft">
                  Thinking...
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-line p-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-ink/30"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-md bg-ink px-3 py-2 text-sm text-white disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}