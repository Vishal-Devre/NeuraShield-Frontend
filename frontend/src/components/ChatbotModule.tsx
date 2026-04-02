import { useState, useRef, useEffect } from "react";
import {
  Send,
  Activity,
  CloudLightning,
  Droplets,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";

type Message = {
  id: string;
  role: "system" | "user" | "ai";
  content: string;
};

const predefinedPrompts = [
  "Analyze global flood risk",
  "Show current active volcanoes",
  "What is the status of the storm?",
  "Predict an earthquake",
];

const CHAT_API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";
const ENABLE_LIVE_CHAT = import.meta.env.VITE_ENABLE_LIVE_CHAT === "true";
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY as
  | string
  | undefined;
const OPENROUTER_API_URL =
  (import.meta.env.VITE_OPENROUTER_API_URL as string | undefined) ||
  "https://openrouter.ai/api/v1/chat/completions";

const formatBulletReply = (title: string, points: string[]) =>
  [`**${title}:**`, ...points.map((point) => `- ${point}`)].join("\n");

const getLocalFallbackReply = (message: string) => {
  const q = message.toLowerCase();

  if (
    ![
      "flood",
      "earthquake",
      "storm",
      "cyclone",
      "volcano",
      "wildfire",
      "landslide",
      "disaster",
      "risk",
      "rain",
      "weather",
      "quake",
      "eruption",
    ].some((term) => q.includes(term))
  ) {
    return "This chatbot is limited to disaster-related queries.";
  }

  if (q.includes("flood") || q.includes("rain")) {
    return formatBulletReply("Flood Risk", [
      "Highest exposure stays in rainfall-heavy and river-basin regions.",
      "Current dashboard logic treats Kenya, India and similar monsoon corridors as flood-first zones.",
      "Use Hydrology Node for rainfall load, river rise and overflow trends.",
    ]);
  }

  if (q.includes("volcano") || q.includes("eruption")) {
    return formatBulletReply("Volcano Analysis", [
      "Volcano risk is shown high only for countries with actual active volcanic belts.",
      "India-like low-volcano countries stay conservative in telemetry analytics.",
      "Philippines, Indonesia and Japan remain stronger volcano-monitoring cases.",
    ]);
  }

  if (q.includes("storm") || q.includes("cyclone") || q.includes("tornado")) {
    return formatBulletReply("Storm Status", [
      "Storm analytics prioritize wind speed, pressure and humidity shifts.",
      "Coastal and cyclone-belt countries naturally score higher than inland stable regions.",
      "Open Storm System for detailed atmospheric breakdown.",
    ]);
  }

  if (q.includes("earthquake") || q.includes("quake") || q.includes("seismic")) {
    return formatBulletReply("Earthquake Analysis", [
      "Seismic risk is weighted mainly for tectonic belts such as Japan, Chile and Indonesia.",
      "Low-frequency countries are intentionally kept moderate unless strong seismic history exists.",
      "Use Seismic Uplink for rupture trend and aftershock-style analytics.",
    ]);
  }

  if (q.includes("wildfire")) {
    return formatBulletReply("Wildfire Analysis", [
      "Wildfire risk increases where heat, drought and vegetation load align.",
      "Nebraska and other unusual U.S. cases are treated as exceptional but real surge scenarios.",
      "Telemetry blends wildfire as a secondary or primary hazard depending on region.",
    ]);
  }

  return formatBulletReply("Disaster Overview", [
    "The dashboard is currently using curated risk logic with realistic geographic weighting.",
    "Rare hazards are kept low in countries where they usually do not occur.",
    "Live API-backed analysis can be enabled once backend services are running.",
  ]);
};

export const ChatbotModule = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const formatMessageText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} style={{ marginBottom: "10px", lineHeight: "1.6" }}>
          {parts.map((part, index) =>
            index % 2 === 1 ? (
              <strong key={index} style={{ color: "var(--accent)" }}>
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </p>
      );
    });
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (messageText: string = input) => {
    if (!messageText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      let content = "";

      if (OPENROUTER_API_KEY) {
        const resp = await fetch(OPENROUTER_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.origin,
            "X-Title": "NeuraShield",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: messageText,
              },
            ],
          }),
        });

        if (!resp.ok) throw new Error("OpenRouter request failed");
        const data = await resp.json();
        content = data?.choices?.[0]?.message?.content || "";
      } else if (ENABLE_LIVE_CHAT) {
        const resp = await fetch(`${CHAT_API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: messageText }),
        });

        if (!resp.ok) throw new Error("API Route failed");
        const data = await resp.json();
        content = data.response || data.error || "";
      }

      if (!content || content.trim().length === 0) {
        content = getLocalFallbackReply(messageText);
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: getLocalFallbackReply(messageText),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <button className="close-chatbot-btn" onClick={onClose} title="Close Chat">
        <X size={24} />
      </button>

      {messages.length === 0 ? (
        <div className="chatbot-welcome">
          <div className="welcome-header">
            <h1>Welcome to NeuraShield AI.</h1>
            <p>
              Uses curated disaster logic now, and can switch to backend-powered
              responses when the live API is enabled.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card card-blue">
              <Activity size={24} className="feature-icon" />
              <h3>Telemetry Analysis</h3>
              <p>Explore country-aware hazard weighting and signal priority.</p>
            </div>
            <div className="feature-card card-orange">
              <AlertTriangle size={24} className="feature-icon" />
              <h3>Disaster History</h3>
              <p>Get concise insights on past seismic and weather events.</p>
            </div>
            <div className="feature-card card-purple">
              <CloudLightning size={24} className="feature-icon" />
              <h3>Storm Tracking</h3>
              <p>Analyze cyclone pressure, wind load and atmospheric changes.</p>
            </div>
            <div className="feature-card card-cyan">
              <Droplets size={24} className="feature-icon" />
              <h3>Hydrologic Threat</h3>
              <p>Monitor flood-first regions with conservative hazard logic.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-history" ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-bubble-container ${msg.role}`}>
              {msg.role === "ai" && (
                <div className="chat-avatar">
                  <Sparkles size={16} />
                </div>
              )}
              <div className={`chat-bubble ${msg.role}`}>
                {formatMessageText(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-bubble-container ai">
              <div className="chat-avatar">
                <Sparkles size={16} />
              </div>
              <div className="chat-bubble ai loading-dots">
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="chatbot-input-area">
        {messages.length === 0 && (
          <div className="predefined-prompts">
            {predefinedPrompts.map((p, idx) => (
              <button key={idx} className="prompt-pill" onClick={() => handleSend(p)}>
                {p}
              </button>
            ))}
          </div>
        )}

        <div className="input-box-wrapper">
          <Sparkles className="input-sparkle" size={20} />
          <input
            type="text"
            className="chatbot-input"
            placeholder="Ask NeuraShield anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className="send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
