import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import FloatingChatbot from "./FloatingChatbot";

const FloatingChatbotWrapper: React.FC = () => {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("isSignedIn") === "true";
  });

  useEffect(() => {
    const checkAuth = () => {
      setIsLoggedIn(localStorage.getItem("isSignedIn") === "true");
    };

    // Check on mount and location change
    checkAuth();

    // Listen for storage changes (login/logout)
    window.addEventListener("storage", checkAuth);
    
    // Also check periodically in case localStorage was changed in same window
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, [location.pathname]);
  
  // Hide chatbot on public pages
  const isPublicPage = location.pathname === "/" || 
                       location.pathname === "/login" || 
                       location.pathname === "/register";
  
  if (!isLoggedIn || isPublicPage) {
    return null;
  }
  
  return <FloatingChatbot />;
};

export default FloatingChatbotWrapper;

