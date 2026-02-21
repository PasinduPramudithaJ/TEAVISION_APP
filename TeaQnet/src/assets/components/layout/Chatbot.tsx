import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { FiSend, FiMessageCircle, FiX, FiMinimize2 } from "react-icons/fi";
import image1 from "../../images/background2.jpg";
import { getApiUrl } from "../../../utils/api";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const Chatbot: React.FC = () => {
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
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    "What is polyphenol classification?",
    "Tell me about Dimbula region",
  ];

  if (isMinimized) {
    return (
      <div
        className="position-fixed bottom-0 end-0 m-4"
        style={{ zIndex: 1050 }}
      >
        <motion.button
          className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2"
          onClick={() => setIsMinimized(false)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiMessageCircle size={24} />
          Chat Assistant
        </motion.button>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div
        className="min-vh-100 d-flex flex-column"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="container flex-grow-1 d-flex flex-column py-4" style={{ maxWidth: "900px" }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card shadow-lg border-0 flex-grow-1 d-flex flex-column"
            style={{
              borderRadius: "25px",
              background: "rgba(255, 255, 255, 0.95)",
              marginTop: "100px",
            }}
          >
            {/* Header */}
            <div
              className="card-header bg-primary text-white d-flex justify-content-between align-items-center"
              style={{ borderRadius: "25px 25px 0 0" }}
            >
              <div className="d-flex align-items-center gap-2">
                <FiMessageCircle size={24} />
                <h4 className="mb-0">Tea Region Classification Assistant</h4>
              </div>
              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => setIsMinimized(true)}
                  title="Minimize"
                >
                  <FiMinimize2 />
                </button>
                <button
                  className="btn btn-sm btn-light"
                  onClick={() => navigate("/dashboard")}
                  title="Close"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div
              className="card-body flex-grow-1 d-flex flex-column p-0"
              style={{ minHeight: "400px", maxHeight: "600px" }}
            >
              <div
                className="flex-grow-1 p-4 overflow-auto"
                style={{ maxHeight: "500px" }}
              >
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`mb-3 d-flex ${
                      message.sender === "user" ? "justify-content-end" : "justify-content-start"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-4 ${
                        message.sender === "user"
                          ? "bg-primary text-white"
                          : "bg-light text-dark"
                      }`}
                      style={{
                        maxWidth: "75%",
                        wordWrap: "break-word",
                      }}
                    >
                      <div className="d-flex align-items-start gap-2">
                        {message.sender === "bot" && (
                          <FiMessageCircle className="mt-1" size={20} />
                        )}
                        <div>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: message.text.replace(/\n/g, "<br />").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                            }}
                          />
                          <small
                            className={`d-block mt-2 ${
                              message.sender === "user" ? "text-white-50" : "text-muted"
                            }`}
                            style={{ fontSize: "0.7rem" }}
                          >
                            {message.timestamp.toLocaleTimeString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <div className="d-flex justify-content-start mb-3">
                    <div className="bg-light p-3 rounded-4">
                      <div className="spinner-border spinner-border-sm text-primary me-2" />
                      Thinking...
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Questions */}
              {messages.length === 1 && (
                <div className="px-4 pb-2">
                  <small className="text-muted d-block mb-2">Quick questions:</small>
                  <div className="d-flex flex-wrap gap-2">
                    {quickQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        className="btn btn-sm btn-outline-primary rounded-pill"
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
              <div className="border-top p-3">
                <div className="input-group">
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control rounded-pill"
                    placeholder="Ask me anything about tea region classification..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                  />
                  <button
                    className="btn btn-primary rounded-pill"
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                  >
                    <FiSend />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 d-flex justify-content-center flex-wrap gap-3"
          >
            <button
              className="btn btn-outline-light rounded-pill px-4"
              onClick={() => navigate("/dashboard")}
            >
              Back to Dashboard
            </button>
            <button
              className="btn btn-success rounded-pill px-4 shadow"
              onClick={() => navigate("/multi")}
            >
              Try Multiple Predict
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Chatbot;

