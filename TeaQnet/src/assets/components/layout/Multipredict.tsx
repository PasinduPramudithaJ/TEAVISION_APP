import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiZap, FiTrash2, FiDownload, FiImage, FiFileText, FiFile, FiArrowLeft, FiHome, FiBarChart2 } from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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

interface ImagePrediction {
  file: File;
  previewUrl: string;
  result?: PredictionResponse;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D885F9", "#FF6B6B", "#6A4C93", "#FFA500", "#8BC34A"];

const MultiPredict: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [selectedModel, setSelectedModel] = useState<string>("resnet18_tea_region");
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const [dragActive, setDragActive] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploaded = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.file.name + img.file.size));
      const unique = uploaded.filter(
        (img) => !existingKeys.has(img.file.name + img.file.size)
      );
      return [...prev, ...unique];
    });

    e.target.value = "";
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
      const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
      if (files.length > 0) {
        const uploaded = files.map((file) => ({
          file,
          previewUrl: URL.createObjectURL(file),
        }));
        setImages((prev) => [...prev, ...uploaded]);
      }
    }
  };

  const getUserEmail = (): string => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        return user.email || "";
      } catch {
        return "";
      }
    }
    return "";
  };

  const safeJsonParse = async (response: Response): Promise<any> => {
    const text = await response.text();
    if (!text || text.trim() === "") {
      return { error: "Empty response from server" };
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      return { error: `Invalid response: ${text.substring(0, 100)}` };
    }
  };

  const handlePredictAll = async () => {
    if (images.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setIsLoading(true);
    const userEmail = getUserEmail();
    try {
      const promises = images.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file);

        try {
          const headers: HeadersInit = {};
          if (userEmail) {
            headers["X-User-Email"] = userEmail;
          }
          const response = await fetch(
            `${apiUrl}/predict?model=${selectedModel}&type=${selectedImageType}`,
            { 
              method: "POST", 
              body: formData,
              headers
            }
          );
          if (!response.ok) {
            const errorData = await safeJsonParse(response);
            return { ...img, result: { error: errorData.error || `HTTP ${response.status}` } };
          }
          const data: PredictionResponse = await safeJsonParse(response);
          return { ...img, result: data };
        } catch (error: any) {
          return { ...img, result: { error: error.message || "Prediction failed" } };
        }
      });

      const updatedResults = await Promise.all(promises);
      setImages(updatedResults);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictSingle = async (index: number) => {
    const img = images[index];
    if (!img) return;

    setLoadingIndex(index);
    const userEmail = getUserEmail();
    try {
      const formData = new FormData();
      formData.append("file", img.file);

      const headers: HeadersInit = {};
      if (userEmail) {
        headers["X-User-Email"] = userEmail;
      }
      const response = await fetch(
        `${apiUrl}/predict?model=${selectedModel}&type=${selectedImageType}`,
        { 
          method: "POST", 
          body: formData,
          headers
        }
      );

      if (!response.ok) {
        const errorData = await safeJsonParse(response);
        setImages((prev) => {
          const updated = [...prev];
          updated[index] = { ...img, result: { error: errorData.error || `HTTP ${response.status}` } };
          return updated;
        });
        return;
      }

      const data: PredictionResponse = await safeJsonParse(response);
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...img, result: data };
        return updated;
      });
    } catch (error: any) {
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = { ...img, result: { error: error.message || "Prediction failed" } };
        return updated;
      });
    } finally {
      setLoadingIndex(null);
    }
  };

  const handleClear = () => setImages([]);

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("tea_predictions.pdf");
  };

  const handleDownloadImage = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = "tea_predictions.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleDownloadCSV = () => {
    if (images.length === 0) return;
    const csvHeader = ["Image Name", "Prediction", "Confidence", "Status"];
    const csvRows = images.map((img) => [
      img.file.name,
      img.result?.prediction || "—",
      img.result?.confidence ? (img.result.confidence * 100).toFixed(2) + "%" : "—",
      img.result?.error ? "Failed" : img.result ? "Done" : "Waiting",
    ]);
    const csvContent = [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tea_predictions.csv";
    link.click();
  };

  const validResults = images.filter((img) => img.result?.prediction && !img.result?.error);
  const predictionCounts: Record<string, number> = {};
  const confidenceSums: Record<string, number> = {};
  validResults.forEach((img) => {
    const pred = img.result!.prediction!;
    const conf = img.result!.confidence || 0;
    predictionCounts[pred] = (predictionCounts[pred] || 0) + 1;
    confidenceSums[pred] = (confidenceSums[pred] || 0) + conf;
  });

  const pieData = Object.keys(predictionCounts).map((key) => ({
    name: key,
    value: predictionCounts[key],
  }));

  const barData = Object.keys(confidenceSums).map((key) => ({
    name: key.length > 15 ? key.substring(0, 15) + "..." : key,
    avgConfidence: (confidenceSums[key] / predictionCounts[key]) * 100,
  }));

  const modelOptions = [
    { value: "resnet18_tea_region", label: "ResNet 18" },
    { value: "customcnn_tea_region", label: "CNN-8" },
    { value: "mobilenetv2_tea_region", label: "MobileNet V2" },
    { value: "efficientnetb0_tea_region", label: "EfficientNet B0" },
    { value: "shufflenetv2_tea_region", label: "ShuffleNet V2" },
    { value: "squeezenet_tea_region", label: "SqueezeNet" },
  ];

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "white",
          minHeight: "85vh",
          paddingTop: "100px",
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 fw-bold"
          style={{ marginTop: "100px", fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.5)"}}
        >
          🔮 Multiple Tea Prediction
        </motion.h2>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card shadow-lg border-0 mb-4"
          style={{
            width: "90%",
            maxWidth: "1000px",
            borderRadius: "25px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="card-body p-4">
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiBarChart2 className="text-primary" />
                  Select Model
                </label>
                <select
                  className="form-select form-select-lg rounded-pill"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  {modelOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiImage className="text-info" />
                  Image Type
                </label>
                <select
                  className="form-select form-select-lg rounded-pill"
                  value={selectedImageType}
                  onChange={(e) => setSelectedImageType(e.target.value)}
                >
                  <option value="raw">Raw Image (Auto Crop)</option>
                  <option value="preprocessed">Preprocessed (Already Cropped)</option>
                </select>
              </div>
            </div>

            {/* Drag and Drop */}
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
                cursor: "pointer",
                background: dragActive ? "rgba(40, 167, 69, 0.1)" : "transparent",
              }}
              onClick={() => document.getElementById("file-input-multi")?.click()}
            >
              <FiUpload className="display-4 text-muted mb-3" />
              <p className="text-muted mb-2 fw-bold">
                {dragActive ? "Drop your images here" : "Drag & drop or click to upload multiple images"}
              </p>
              <input
                id="file-input-multi"
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="d-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center flex-wrap gap-2">
              <motion.button
                className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                onClick={handlePredictAll}
                disabled={isLoading || images.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Predicting All...
                  </>
                ) : (
                  <>
                    <FiZap /> Predict All
                  </>
                )}
              </motion.button>
              <button
                className="btn btn-danger btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                onClick={handleClear}
                disabled={images.length === 0}
              >
                <FiTrash2 /> Clear All
              </button>
              {images.length > 0 && (
                <div className="dropdown">
                  <button
                    className="btn btn-success btn-lg rounded-pill shadow dropdown-toggle d-flex align-items-center gap-2 px-4"
                    type="button"
                    data-bs-toggle="dropdown"
                  >
                    <FiDownload /> Download Results
                  </button>
                  <ul className="dropdown-menu shadow-lg">
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleDownloadImage}>
                        <FiImage /> PNG
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleDownloadPDF}>
                        <FiFileText /> PDF
                      </button>
                    </li>
                    <li>
                      <button className="dropdown-item d-flex align-items-center gap-2" onClick={handleDownloadCSV}>
                        <FiFile /> CSV
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Charts */}
        {validResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4 mb-4"
            style={{ maxWidth: "1200px" }}
          >
            <h4 className="text-white mb-4 fw-bold">📊 Prediction Summary</h4>
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">🥧 Prediction Distribution</h6>
                    <ResponsiveContainer width="100%" height={330}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={100} label>
                          {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">📈 Average Confidence per Region</h6>
                    <ResponsiveContainer width="100%" height={330}>
                      <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgConfidence" fill="#82ca9d" barSize={60} radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Table */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="container mt-4"
            style={{ maxWidth: "1200px" }}
          >
            <div
              className="card border-0 shadow-lg"
              ref={tableRef}
              style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                maxHeight: images.length > 10 ? "600px" : "auto",
                overflowY: images.length > 10 ? "auto" : "visible",
              }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-dark">📋 Prediction Results</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Image Name</th>
                        <th>Prediction</th>
                        <th>Confidence</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map((img, i) => (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + i * 0.05 }}
                        >
                          <td className="fw-bold">{i + 1}</td>
                          <td className="text-center">
                            <img
                              src={img.previewUrl}
                              alt={`preview-${i}`}
                              width="80"
                              height="80"
                              className="rounded shadow"
                              style={{ objectFit: "cover" }}
                            />
                          </td>
                          <td>
                            <small className="text-muted">{img.file.name}</small>
                          </td>
                          <td>
                            <span className="badge bg-success rounded-pill px-3 py-2">
                              {img.result?.prediction || "—"}
                            </span>
                          </td>
                          <td>
                            {img.result?.confidence ? (
                              <span className="fw-bold text-primary">
                                {(img.result.confidence * 100).toFixed(2)}%
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {img.result?.error ? (
                              <span className="badge bg-danger">❌ Failed</span>
                            ) : img.result ? (
                              <span className="badge bg-success">✅ Done</span>
                            ) : (
                              <span className="badge bg-warning">⏳ Waiting</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill"
                              disabled={loadingIndex === i}
                              onClick={() => handlePredictSingle(i)}
                            >
                              {loadingIndex === i ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" />
                                  Predicting...
                                </>
                              ) : (
                                <>
                                  <FiZap className="me-1" />
                                  Predict
                                </>
                              )}
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-5 d-flex justify-content-center flex-wrap gap-3"
        >
          <button className="btn btn-outline-light rounded-pill px-4" onClick={() => navigate(-1)}>
            <FiArrowLeft className="me-2" />
            Back
          </button>
          <button className="btn btn-success rounded-pill px-4 shadow" onClick={() => navigate("/dashboard")}>
            Dashboard
          </button>
          <button className="btn btn-info rounded-pill px-4 shadow" onClick={() => navigate("/comparison")}>
            🧠 Model Comparison
          </button>
          <button className="btn btn-dark rounded-pill px-4" onClick={() => navigate("/")}>
            <FiHome className="me-2" />
            Home
          </button>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default MultiPredict;
