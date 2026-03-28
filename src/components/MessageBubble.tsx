"use client";
import { Message } from "@/types";
import { ACTIONS_LINE } from "@/lib/assistant";

interface Props { message: Message; }

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  const text = message.text.replace(ACTIONS_LINE, "").trimEnd();

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-bot'}`}>
      {text}
    </div>
  );
}
