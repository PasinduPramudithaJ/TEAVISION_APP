import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiDownload, FiArrowLeft, FiHome, FiActivity, FiX } from "react-icons/fi";

const regionMapping: { [key: string]: string } = {
  "DI": "Dimbula Region",
  "UV": "Uva Region",
  "KA": "Kandy Region",
  "NU": "Nuwara Eliya Region",
  "SB": "Sabaragamuwa Region",
  "UP": "Udupusellawa Region",
  "RU": "Ruhuna Region"
  // Add all your region keywords here
};

const FeatureExtraction: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [outputCsvName, setOutputCsvName] = useState("handcrafted_features.csv");
  const [isExtracting, setIsExtracting] = useState(false);
  const [apiUrl, setApiUrl] = useState(`http://${window.location.hostname}:5000`);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  const getRegionName = (filename: string) => {
    const lower = filename.toLowerCase();
    for (const key in regionMapping) {
      if (lower.includes(key)) return regionMapping[key];
    }
    return "Unknown Region";
  };

  const handleExtractFeatures = async () => {
    if (!files.length) return alert("Please select dataset images!");
    if (!outputCsvName) return alert("Provide CSV file name!");

    setIsExtracting(true);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        // Add region info as extra field for each image
        const region = getRegionName(f.name);
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        formData.append("images", f);
        formData.append("regions", region);
        formData.append("user_email", user.email);
      });
      formData.append("output_csv", outputCsvName);

      const res = await fetch(`${apiUrl}/extract_features`, { method: "POST", body: formData });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Feature extraction failed");
      }

      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = outputCsvName;
      link.click();
      alert("✔ Features extracted successfully!");
      clearFiles();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) setFiles(Array.from(selected));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!droppedFiles.length) return alert("Please drop image files!");
    setFiles(droppedFiles);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          minHeight: "85vh",
          paddingTop: "100px",
          color: "white",
        }}
      >
        <motion.h2 className="fw-bold mb-4">🖼️ Handcrafted Feature Extraction</motion.h2>

        {/* File Upload Card */}
        <div
          className="card shadow-lg p-4 mb-4 d-flex flex-column align-items-center flex-wrap"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ maxWidth: "700px", width: "100%", cursor: "pointer" }}
        >
          <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100">
            <p className="mb-0 fw-semibold">
              Drag & Drop or Select Images
              {files.length > 0 && (
                <span className="badge bg-info ms-2">{files.length} image{files.length > 1 ? "s" : ""}</span>
              )}
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              className="d-none"
              ref={fileInputRef}
              id="image-upload"
              onChange={handleFileChange}
            />
            <label htmlFor="image-upload" className="btn btn-outline-primary btn-lg rounded-pill d-flex align-items-center gap-2">
              <FiUpload /> Upload Images
            </label>
          </div>

          <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100 mt-3">
            <label className="form-label fw-bold mb-0">Output CSV Name:</label>
            <input
              type="text"
              className="form-control"
              placeholder="handcrafted_features.csv"
              value={outputCsvName}
              onChange={(e) => setOutputCsvName(e.target.value)}
            />
          </div>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <button
              className="btn btn-success rounded-pill d-flex align-items-center gap-2"
              disabled={!files.length || !outputCsvName || isExtracting}
              onClick={handleExtractFeatures}
            >
              <FiDownload /> {isExtracting ? "Extracting..." : "Extract Features"}
            </button>
            {files.length > 0 && (
              <button
                className="btn btn-danger rounded-pill d-flex align-items-center gap-2"
                onClick={clearFiles}
              >
                <FiX /> Cancel
              </button>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-5 d-flex gap-3">
          <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
          <button className="btn btn-outline-light" onClick={() => navigate("/")}>
            <FiHome /> Home
          </button>
          <button className="btn btn-outline-light" onClick={() => navigate("/tea_region_group_prediction")}>
            <FiActivity /> Region & Group Prediction
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default FeatureExtraction;