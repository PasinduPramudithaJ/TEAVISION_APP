import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import Home from "./assets/components/layout/Home";
import Login from "./assets/components/User/Login";
import Register from "./assets/components/User/Register";
import Dashboard from "./assets/components/layout/Dashboard";
import Settings from "./assets/components/layout/settings";
import Results from "./assets/components/layout/Results";
import Multipredict from "./assets/components/layout/Multipredict";
import { JSX } from "react";
import ModelComparison from "./assets/components/layout/ModelComparison";
import CropLiquorImages from "./assets/components/layout/CropLiquorImages";
import SuperDashboard from "./assets/components/layout/SuperDashboard";
import PolyphenolPredict from "./assets/components/layout/PolyphenolPredict";
import UserHistory from "./assets/components/layout/UserHistory";
import AdminHistory from "./assets/components/layout/AdminHistory";
import Profile from "./assets/components/User/Profile";
import Chatbot from "./assets/components/layout/Chatbot";
import FloatingChatbotWrapper from "./assets/components/layout/FloatingChatbotWrapper";
import BatchFolderPredict from "./assets/components/layout/BatchFolderPredict";
import TeaRegionsGuide from "./assets/components/layout/TeaRegionsGuide";
import LiquorImageTest from "./assets/components/layout/LiquorImageTest";
import ImageRGBAnalysis from "./assets/components/layout/ImageRGBAnalysis";
import ImageTastePredictionCSV from "./assets/components/layout/ImagetastePredictionCSV";
import RegionGroupPrediction from "./assets/components/layout/RegionGroupPrediction";
import FeatureExtraction from "./assets/components/layout/FeatureExtraction";
import CombinedFeatureRegion from "./assets/components/layout/CombinedFeatureRegion";
import CombinedTeaPipeline from "./assets/components/layout/CombinedTeaPipeline";

// Enhanced ProtectedRoute component
const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const isSignedIn = localStorage.getItem("isSignedIn") === "true";
  const storedUser = localStorage.getItem("user");
  const location = useLocation();

  // If user not signed in, redirect to login
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  // Check user data
  let user = null;
  let isAdmin = false;
  
  try {
    user = storedUser ? JSON.parse(storedUser) : null;
    // Check admin status from is_admin field or email fallback
    isAdmin = user && (user.is_admin === true || user.email === "pramudithapasindu48@gmail.com");
  } catch (e) {
    // Invalid user data, redirect to login
    localStorage.removeItem("isSignedIn");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  // Restrict access to /super
  if (location.pathname === "/super" && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  // Otherwise allow
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tea_region_group_prediction"
          element={
            <ProtectedRoute>
              <RegionGroupPrediction/>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feature_extraction"
          element={
            <ProtectedRoute>
              <FeatureExtraction />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/combined_feature_region"
          element={
            <ProtectedRoute>
              <CombinedFeatureRegion />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/combined_tea_pipeline"
          element={
            <ProtectedRoute>
              <CombinedTeaPipeline />
            </ProtectedRoute>
          }
        />
        <Route
          path="/liquorImageTest"
          element={
            <ProtectedRoute>
              <LiquorImageTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Results />
            </ProtectedRoute>
          }
        />
        <Route
          path="/multi"
          element={
            <ProtectedRoute>
              <Multipredict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/comparison"
          element={
            <ProtectedRoute>
              <ModelComparison />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crop"
          element={
            <ProtectedRoute>
              <CropLiquorImages />
            </ProtectedRoute>
          }
        />
        <Route
          path="/polyphenol"
          element={
            <ProtectedRoute>
              <PolyphenolPredict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/super"
          element={
            <ProtectedRoute>
              <SuperDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <UserHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/history"
          element={
            <ProtectedRoute>
              <AdminHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          }
        />
        <Route
          path="/batch-folder"
          element={
            <ProtectedRoute>
              <BatchFolderPredict />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tea-regions"
          element={
            <ProtectedRoute>
              <TeaRegionsGuide />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rgb-analysis"
          element={
            <ProtectedRoute>
              <ImageRGBAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taste-predict-csv"
          element={
            <ProtectedRoute>
              <ImageTastePredictionCSV />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Floating Chatbot - appears on all pages when logged in (except public pages) */}
      <FloatingChatbotWrapper />
    </Router>
  );
}

export default App;
