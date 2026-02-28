"use client"

interface ChatMessageProps {
  role: "user" | "assistant"
  content: string
  avatar?: string
  timestamp?: string
}

export default function ChatMessage({ role, content, avatar, timestamp }: ChatMessageProps) {
  const isUser = role === "user"

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm ${
          isUser ? "bg-accent/20" : "bg-card"
        }`}
      >
        {isUser ? avatar || "👤" : "🤖"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-white rounded-br-md"
            : "bg-card text-foreground rounded-bl-md"
        }`}
      >
        {/* Render content with basic formatting */}
        <div className="whitespace-pre-wrap break-words chat-content">
          {formatContent(content)}
        </div>
        {timestamp && (
          <div
            className={`text-[10px] mt-1 ${
              isUser ? "text-white/60" : "text-muted"
            }`}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}

function formatContent(text: string): React.ReactNode {
  // Simple markdown-like formatting: **bold**, bullet lists
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return part
  })
}
