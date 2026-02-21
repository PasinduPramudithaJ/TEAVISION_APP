import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiSend, FiMessageCircle, FiX, FiMinimize2 } from "react-icons/fi";
import { getApiUrl } from "../../../utils/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const FloatingChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your Tea Region Classification Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();

      if (response.ok) {
        const botMessage: Message = {
          id: Date.now() + 1,
          text: data.response || "I'm sorry, I didn't understand that.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error || "Failed to get response");
      }
    } catch (error: any) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What regions can be classified?",
    "Which model should I use?",
    "How do I predict tea regions?",
  ];

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          className="position-fixed bottom-0 end-0 m-4 shadow-lg border-0"
          style={{
            zIndex: 1050,
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
          }}
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <FiMessageCircle size={28} className="mx-auto" />
          {messages.length > 1 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: "0.7rem", padding: "2px 6px" }}
            >
              {messages.length - 1}
            </span>
          )}
        </motion.button>
      )}

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="position-fixed bottom-0 end-0 m-4 shadow-lg"
            style={{
              zIndex: 1051,
              width: "380px",
              maxWidth: "calc(100vw - 2rem)",
              height: "600px",
              maxHeight: "calc(100vh - 2rem)",
              borderRadius: "20px",
              background: "white",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div
              className="d-flex justify-content-between align-items-center p-3 text-white"
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "20px 20px 0 0",
              }}
            >
              <div className="d-flex align-items-center gap-2">
                <FiMessageCircle size={20} />
                <h6 className="mb-0 fw-bold">Tea Classification Assistant</h6>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setIsOpen(false)}
                  style={{ padding: "2px 8px" }}
                >
                  <FiMinimize2 size={16} />
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => {
                    setIsOpen(false);
                    setMessages([
                      {
                        id: 1,
                        text: "Hello! I'm your Tea Region Classification Assistant. How can I help you today?",
                        sender: "bot",
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                  style={{ padding: "2px 8px" }}
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="flex-grow-1 p-3 overflow-auto"
              style={{ background: "#f8f9fa", minHeight: 0 }}
            >
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-2 d-flex ${
                    message.sender === "user" ? "justify-content-end" : "justify-content-start"
                  }`}
                >
                  <div
                    className={`p-2 rounded-3 ${
                      message.sender === "user"
                        ? "bg-primary text-white"
                        : "bg-white text-dark shadow-sm"
                    }`}
                    style={{
                      maxWidth: "80%",
                      wordWrap: "break-word",
                      fontSize: "0.9rem",
                    }}
                  >
                    <div
                      dangerouslySetInnerHTML={{
                        __html: message.text
                          .replace(/\n/g, "<br />")
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                      }}
                    />
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="d-flex justify-content-start mb-2">
                  <div className="bg-white p-2 rounded-3 shadow-sm">
                    <div className="spinner-border spinner-border-sm text-primary me-2" />
                    <span style={{ fontSize: "0.9rem" }}>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-3 pb-2" style={{ background: "#f8f9fa" }}>
                <small className="text-muted d-block mb-2">Quick questions:</small>
                <div className="d-flex flex-wrap gap-1">
                  {quickQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      className="btn btn-sm btn-outline-primary rounded-pill"
                      style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                      onClick={() => {
                        setInput(question);
                        inputRef.current?.focus();
                      }}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 border-top">
              <div className="input-group">
                <input
                  ref={inputRef}
                  type="text"
                  className="form-control rounded-pill"
                  placeholder="Ask me anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  style={{ fontSize: "0.9rem" }}
                />
                <button
                  className="btn btn-primary rounded-pill"
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{ padding: "0 15px" }}
                >
                  <FiSend size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingChatbot;

