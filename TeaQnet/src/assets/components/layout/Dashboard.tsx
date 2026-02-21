import React, { useState, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { FiLogOut, FiCamera, FiRefreshCw, FiUpload, FiImage, FiZap, FiArrowRight } from "react-icons/fi";

interface PredictionResponse {
  prediction?: string;
  confidence?: number;
  probabilities?: Record<string, number>;
  info?: {
    description: string;
    origin: string;
    flavorNotes: string[];
  };
  croppedImage?: string;
  error?: string;
}

const Dashboard: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [lastPrediction, setLastPrediction] = useState<PredictionResponse | null>(null);
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const [dragActive, setDragActive] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isSignedIn = localStorage.getItem("isSignedIn") === "true";
    if (!isSignedIn) navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  useEffect(() => {
    if (location.state) {
      const stateData = location.state as PredictionResponse;
      setLastPrediction(stateData);
      if (stateData.croppedImage) setPreviewUrl(stateData.croppedImage);
    }
  }, [location.state]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setLastPrediction(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedImage(file);
        setPreviewUrl(URL.createObjectURL(file));
        setLastPrediction(null);
      }
    }
  };

  const handleCaptureImage = async () => {
    try {
      const photo = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      });

      if (photo.webPath) {
        setPreviewUrl(photo.webPath);
        const response = await fetch(photo.webPath);
        const blob = await response.blob();
        const file = new File([blob], "captured_photo.jpg", { type: blob.type });
        setSelectedImage(file);
        setLastPrediction(null);
      }
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera.");
    }
  };

  const handlePredict = async () => {
    if (!selectedImage) return alert("Please upload or capture an image first.");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      // Get user email from localStorage
      const storedUser = localStorage.getItem("user");
      const userEmail = storedUser ? JSON.parse(storedUser).email : "";
      
      const response = await fetch(`${apiUrl}/predict?type=${selectedImageType}`, {
        method: "POST",
        headers: {
          "X-User-Email": userEmail,
        },
        body: formData,
      });
      const data: PredictionResponse = await response.json();
      if (data.error) throw new Error(data.error);
      navigate("/results", { state: data });
    } catch (err: any) {
      alert("Prediction failed: " + err.message);
    }
    setIsLoading(false);
  };

  const handleClearImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setLastPrediction(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("isSignedIn");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-start py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          minHeight: "85vh",
          position: "relative",
          color: "#fff",
          paddingTop: "200px",
        }}
      >
        {/* Logout Button */}
        <motion.button
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={handleLogout}
          className="btn btn-danger position-absolute rounded-pill shadow-lg"
          style={{ top: 12, right: 12, zIndex: 10 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <FiLogOut size={18} /> Logout
        </motion.button>

        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4 fw-bold"
          style={{ 
            textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            fontSize: "2.5rem",
            marginTop: "100px"
          }}
        >
          🍵 Tea Region Dashboard
        </motion.h2>

        <div className="container">
          <div className="row justify-content-center gy-4">
            {/* Image Upload Card */}
            <motion.div
              className="col-md-5"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="card shadow-lg border-0" style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)"
              }}>
                <div className="card-body p-4">
                  <h5 className="card-title mb-4 text-center fw-bold">
                    <FiImage className="me-2 text-primary" />
                    Select Image Type
                  </h5>
                  
                  {/* Image Type Selector */}
                  <div className="btn-group w-100 mb-4" role="group">
                    <button
                      type="button"
                      className={`btn ${selectedImageType === "raw" ? "btn-success" : "btn-outline-success"} rounded-pill`}
                      onClick={() => setSelectedImageType("raw")}
                    >
                      Raw Image
                    </button>
                    <button
                      type="button"
                      className={`btn ${selectedImageType === "preprocessed" ? "btn-success" : "btn-outline-success"} rounded-pill`}
                      onClick={() => setSelectedImageType("preprocessed")}
                    >
                      Preprocessed
                    </button>
                  </div>

                  {/* Drag and Drop Area */}
                  <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`border-3 border-dashed rounded-4 p-5 text-center mb-3 ${
                      dragActive ? "border-success bg-light" : "border-secondary"
                    }`}
                    style={{
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <FiUpload className="display-4 text-muted mb-3" />
                    <p className="text-muted mb-2">
                      {dragActive ? "Drop your image here" : "Drag & drop or click to upload"}
                    </p>
                    <input
                      id="file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="d-none"
                    />
                  </div>

                  <button
                    className="btn btn-warning w-100 rounded-pill shadow mb-2 d-flex align-items-center justify-content-center gap-2"
                    onClick={handleCaptureImage}
                  >
                    <FiCamera /> Capture Photo
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Preview and Prediction Card */}
            {previewUrl && (
              <motion.div
                className="col-md-5"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="card shadow-lg border-0" style={{
                  borderRadius: "20px",
                  background: "rgba(0, 0, 0, 0.8)",
                  backdropFilter: "blur(10px)"
                }}>
                  <div className="card-body p-4">
                    <div className="preview-container mb-4 position-relative" style={{ borderRadius: "15px", overflow: "hidden" }}>
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="img-fluid w-100"
                        style={{
                          height: "300px",
                          objectFit: "cover",
                          transition: "transform 0.3s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                    </div>

                    <motion.button
                      className="btn btn-primary w-100 mb-3 rounded-pill shadow-lg d-flex align-items-center justify-content-center gap-2"
                      onClick={handlePredict}
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Predicting...
                        </>
                      ) : (
                        <>
                          <FiZap /> Predict Region
                        </>
                      )}
                    </motion.button>

                    <button
                      className="btn btn-outline-danger w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={handleClearImage}
                    >
                      <FiRefreshCw /> Clear Image
                    </button>

                    {lastPrediction?.prediction && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alert alert-info mt-3 rounded-pill border-0 shadow"
                      >
                        <strong>Last Prediction:</strong> {lastPrediction.prediction}{" "}
                        {lastPrediction.confidence && `(${(lastPrediction.confidence * 100).toFixed(1)}% confidence)`}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="d-flex justify-content-center mt-5 gap-3 flex-wrap"
          >
            <button
              className="btn btn-outline-light rounded-pill px-4"
              onClick={() => navigate(-1)}
            >
              ← Back
            </button>
            <button
              className="btn btn-success rounded-pill px-4 shadow d-flex align-items-center gap-2"
              onClick={() => navigate("/multi")}
            >
              🔮 Multiple Predictions <FiArrowRight />
            </button>
            <button
              className="btn btn-warning rounded-pill px-4 shadow d-flex align-items-center gap-2"
              onClick={() => navigate("/batch-folder")}
            >
              📁 Batch Prediction <FiArrowRight />
            </button>
            <button
              className="btn btn-info rounded-pill px-4 shadow d-flex align-items-center gap-2"
              onClick={() => navigate("/crop")}
            >
              ✂️ Crop Tool <FiArrowRight />
            </button>
            <button
              className="btn btn-danger rounded-pill px-4 shadow d-flex align-items-center gap-2"
              onClick={() => navigate("/rgb-analysis")}
            >
              📊 RGB Analysis <FiArrowRight />
            </button>
            <button
              className="btn btn-dark rounded-pill px-4"
              onClick={() => navigate("/")}
            >
              🏠 Home
            </button>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;
