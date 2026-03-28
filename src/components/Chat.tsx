"use client";

import { useState, useRef, useEffect, KeyboardEvent, useCallback } from "react";
import { Message, SearchParams, Restaurant } from "@/types";
import { ACTIONS_LINE } from "@/lib/assistant";
import MessageBubble from "./MessageBubble";
import QuickActions from "./QuickActions";

const STORAGE_KEY = "restaurant-assistant-state";

const WELCOME: Message = {
  role: "assistant",
  text: "Привет! Помогу подобрать ресторан.\nНапишите город.",
};

interface ChatState {
  messages: Message[];
  params: Partial<SearchParams>;
  prevShown: number;
  restaurants: Restaurant[];
}

function loadState(): ChatState | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (!parsed.messages || !Array.isArray(parsed.messages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: ChatState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export default function Chat() {
  const savedState = useRef<ChatState | null>(null);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<Partial<SearchParams>>({});
  const [prevShown, setPrevShown] = useState(0);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : '';

  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setMessages(saved.messages);
      setParams(saved.params);
      setPrevShown(saved.prevShown);
      setRestaurants(saved.restaurants);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    saveState({ messages, params, prevShown, restaurants });
  }, [messages, params, prevShown, restaurants]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), params, prevShown, restaurants }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await res.text();
        console.error("Non-JSON response:", textResponse);
        throw new Error("Сервер вернул некорректный ответ");
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply },
      ]);
      if (data.params) setParams(data.params);
      if (data.prevShown !== undefined) setPrevShown(data.prevShown);
      if (data.restaurants) setRestaurants(data.restaurants);
    } catch (e: any) {
      console.error("API Error:", e);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Ошибка: ${e.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [loading, params, prevShown, restaurants, API_BASE_URL]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || loading) return;
    send(text);
  }, [send, loading]);

  const resetChat = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessages([WELCOME]);
    setParams({});
    setPrevShown(0);
    setRestaurants([]);
  }, []);

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const lastMsg = messages[messages.length - 1];
  const showActions =
    lastMsg?.role === "assistant" && lastMsg.text.includes(ACTIONS_LINE);

  const actionLabels = ACTIONS_LINE.split(" · ");

  return (
    <div className="chat-wrapper">
      <header className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="chat-logo">Ресторанный ассистент</span>
          <button
            onClick={resetChat}
            title="Начать заново"
            className="reset-btn"
          >
            Сбросить чат
          </button>
        </div>
        <span className="chat-powered">Поиск через 2GIS</span>
      </header>

      <div className="chat-feed">
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        {loading && (
          <div className="chat-loading">
            ...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {showActions && !loading && (
        <QuickActions labels={actionLabels} onAction={send} />
      )}

      <div className="chat-input-row">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder="Введите сообщение..."
            rows={1}
            disabled={loading}
          />
          <button
            className="chat-send-btn"
            onClick={() => handleSend(input)}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
