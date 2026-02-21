import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { FiUpload, FiZap, FiTrash2, FiDownload, FiFileText, FiFile, FiArrowLeft, FiHome, FiFilter, FiImage } from "react-icons/fi";
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
  error?: string;
}

interface ImagePrediction {
  file: File;
  previewUrl: string;
  resultResNet18?: PredictionResponse;
  resultCNN8?: PredictionResponse;
  resultSqueezeNet?: PredictionResponse;
  resultMobileNetV2?: PredictionResponse;
  resultEfficientNetB0?: PredictionResponse;
  resultShuffleNetV2?: PredictionResponse;
  [key: string]: any;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D885F9", "#FF6B6B"];

const ModelComparison: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rowLoadingIndex, setRowLoadingIndex] = useState<number | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const [selectedModel, setSelectedModel] = useState("all");
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
      const unique = uploaded.filter((img) => !existingKeys.has(img.file.name + img.file.size));
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

  const handlePredictSingle = async (index: number) => {
    const img = images[index];
    if (!img) return;
    setRowLoadingIndex(index);
    const userEmail = getUserEmail();

    try {
      const headers: HeadersInit = {};
      if (userEmail) {
        headers["X-User-Email"] = userEmail;
      }

      const fetchModel = async (modelName: string): Promise<PredictionResponse> => {
        try {
          // Create a new FormData for each request since FormData can only be read once
          const formData = new FormData();
          formData.append("file", img.file);
          
          const res = await fetch(`${apiUrl}/predict?model=${modelName}&type=${selectedImageType}`, {
            method: "POST",
            body: formData,
            headers,
          });
          if (!res.ok) {
            const errorData = await safeJsonParse(res);
            return { error: errorData.error || `HTTP ${res.status}` };
          }
          return await safeJsonParse(res);
        } catch (error: any) {
          return { error: error.message || "Prediction failed" };
        }
      };

      const [resNet18, cnn8, squeezeNet, mobileNetV2, efficientNetB0, shuffleNetV2] = await Promise.all([
        fetchModel("resnet18_tea_region"),
        fetchModel("customcnn_tea_region"),
        fetchModel("squeezenet_tea_region"),
        fetchModel("mobilenetv2_tea_region"),
        fetchModel("efficientnetb0_tea_region"),
        fetchModel("shufflenetv2_tea_region"),
      ]);

      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...img,
          resultResNet18: resNet18,
          resultCNN8: cnn8,
          resultSqueezeNet: squeezeNet,
          resultMobileNetV2: mobileNetV2,
          resultEfficientNetB0: efficientNetB0,
          resultShuffleNetV2: shuffleNetV2,
        };
        return updated;
      });
    } catch {
      setImages((prev) => {
        const updated = [...prev];
        updated[index] = {
          ...img,
          resultResNet18: { error: "Prediction failed" },
          resultCNN8: { error: "Prediction failed" },
          resultSqueezeNet: { error: "Prediction failed" },
          resultMobileNetV2: { error: "Prediction failed" },
          resultEfficientNetB0: { error: "Prediction failed" },
          resultShuffleNetV2: { error: "Prediction failed" },
        };
        return updated;
      });
    } finally {
      setRowLoadingIndex(null);
    }
  };

  const handlePredictAll = async () => {
    if (images.length === 0) return alert("Please upload at least one image.");
    setIsLoading(true);
    try {
      const promises = images.map((_img, i) => handlePredictSingle(i));
      await Promise.all(promises);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => setImages([]);

  const validResults = images.filter((img) => img.resultResNet18?.prediction && img.resultCNN8?.prediction);
  const agreementCount = {
    agree: validResults.filter((img) => img.resultResNet18?.prediction === img.resultCNN8?.prediction).length,
    disagree: validResults.filter((img) => img.resultResNet18?.prediction !== img.resultCNN8?.prediction).length,
  };

  const pieData = [
    { name: "Agreement", value: agreementCount.agree },
    { name: "Disagreement", value: agreementCount.disagree },
  ];

  const barData = validResults.map((img) => ({
    name: img.file.name.length > 10 ? img.file.name.substring(0, 10) + "..." : img.file.name,
    resnet18: img.resultResNet18?.confidence ? img.resultResNet18.confidence * 100 : 0,
    cnn8: img.resultCNN8?.confidence ? img.resultCNN8.confidence * 100 : 0,
    squeezenet: img.resultSqueezeNet?.confidence ? img.resultSqueezeNet.confidence * 100 : 0,
    mobilenetv2: img.resultMobileNetV2?.confidence ? img.resultMobileNetV2.confidence * 100 : 0,
    efficientnetb0: img.resultEfficientNetB0?.confidence ? img.resultEfficientNetB0.confidence * 100 : 0,
    shufflenetv2: img.resultShuffleNetV2?.confidence ? img.resultShuffleNetV2.confidence * 100 : 0,
  }));

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("model_comparison.pdf");
  };

  const handleDownloadCSV = () => {
    if (images.length === 0) return;
    const csvHeader = [
      "Image Name",
      "ResNet18 Prediction", "ResNet18 Confidence",
      "CNN-8 Prediction", "CNN-8 Confidence",
      "SqueezeNet Prediction", "SqueezeNet Confidence",
      "MobileNetV2 Prediction", "MobileNetV2 Confidence",
      "EfficientNetB0 Prediction", "EfficientNetB0 Confidence",
      "ShuffleNetV2 Prediction", "ShuffleNetV2 Confidence",
    ];
    const csvRows = images.map((img) => [
      img.file.name,
      img.resultResNet18?.prediction || "—",
      img.resultResNet18?.confidence ? (img.resultResNet18.confidence * 100).toFixed(2) + "%" : "—",
      img.resultCNN8?.prediction || "—",
      img.resultCNN8?.confidence ? (img.resultCNN8.confidence * 100).toFixed(2) + "%" : "—",
      img.resultSqueezeNet?.prediction || "—",
      img.resultSqueezeNet?.confidence ? (img.resultSqueezeNet.confidence * 100).toFixed(2) + "%" : "—",
      img.resultMobileNetV2?.prediction || "—",
      img.resultMobileNetV2?.confidence ? (img.resultMobileNetV2.confidence * 100).toFixed(2) + "%" : "—",
      img.resultEfficientNetB0?.prediction || "—",
      img.resultEfficientNetB0?.confidence ? (img.resultEfficientNetB0.confidence * 100).toFixed(2) + "%" : "—",
      img.resultShuffleNetV2?.prediction || "—",
      img.resultShuffleNetV2?.confidence ? (img.resultShuffleNetV2.confidence * 100).toFixed(2) + "%" : "—",
    ]);
    const csvContent = [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "tea_model_comparison_predictions.csv";
    link.click();
  };

  const modelColumns = [
    { key: "resultResNet18", label: "ResNet18", color: "#82ca9d" },
    { key: "resultCNN8", label: "CNN-8", color: "#8884d8" },
    { key: "resultSqueezeNet", label: "SqueezeNet", color: "#FFBB28" },
    { key: "resultMobileNetV2", label: "MobileNetV2", color: "#FF8042" },
    { key: "resultEfficientNetB0", label: "EfficientNetB0", color: "#D885F9" },
    { key: "resultShuffleNetV2", label: "ShuffleNetV2", color: "#FF6B6B" },
  ];

  const displayedColumns =
    selectedModel === "all"
      ? modelColumns
      : modelColumns.filter((col) => col.key === selectedModel);

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
          style={{ marginTop: "100px", fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
        >
          🧠 Model Comparison
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
              <div className="col-md-6">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiFilter className="text-primary" />
                  Filter Models
                </label>
                <select
                  className="form-select form-select-lg rounded-pill"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="all">All Models</option>
                  {modelColumns.map((col) => (
                    <option key={col.key} value={col.key}>
                      {col.label}
                    </option>
                  ))}
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
              onClick={() => document.getElementById("file-input-compare")?.click()}
            >
              <FiUpload className="display-4 text-muted mb-3" />
              <p className="text-muted mb-2 fw-bold">
                {dragActive ? "Drop your images here" : "Drag & drop or click to upload images for comparison"}
              </p>
              <input
                id="file-input-compare"
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
                    Predicting All Models...
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
            <h4 className="text-white mb-4 fw-bold">📊 Model Comparison Summary</h4>
            <div className="row g-4">
              <div className="col-md-6">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body p-4">
                    <h6 className="fw-bold mb-3">🥧 Agreement vs Disagreement</h6>
                    <ResponsiveContainer width="100%" height={300}>
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
                    <h6 className="fw-bold mb-3">📈 Confidence Comparison per Image</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={barData}>
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="resnet18" fill="#82ca9d" name="ResNet18" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="cnn8" fill="#8884d8" name="CNN-8" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="squeezenet" fill="#FFBB28" name="SqueezeNet" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="mobilenetv2" fill="#FF8042" name="MobileNetV2" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="efficientnetb0" fill="#D885F9" name="EfficientNetB0" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="shufflenetv2" fill="#FF6B6B" name="ShuffleNetV2" radius={[8, 8, 0, 0]} />
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
                <h5 className="fw-bold mb-3 text-dark">📋 Model Comparison Results</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Image Name</th>
                        {displayedColumns.map((col) => (
                          <React.Fragment key={col.key}>
                            <th>{col.label}</th>
                            <th>{col.label} Conf</th>
                          </React.Fragment>
                        ))}
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
                          {displayedColumns.map((col) => (
                            <React.Fragment key={col.key}>
                              <td>
                                {img[col.key]?.prediction ? (
                                  <span className="badge bg-success rounded-pill">{img[col.key].prediction}</span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td>
                                {img[col.key]?.confidence ? (
                                  <span className="fw-bold" style={{ color: col.color }}>
                                    {(img[col.key].confidence * 100).toFixed(2)}%
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </React.Fragment>
                          ))}
                          <td>
                            {displayedColumns.some((col) => img[col.key]?.error) ? (
                              <span className="badge bg-danger">❌ Failed</span>
                            ) : displayedColumns.some((col) => img[col.key]?.prediction) ? (
                              <span className="badge bg-success">✅ Done</span>
                            ) : (
                              <span className="badge bg-warning">⏳ Waiting</span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-outline-primary rounded-pill"
                              disabled={rowLoadingIndex === i}
                              onClick={() => handlePredictSingle(i)}
                            >
                              {rowLoadingIndex === i ? (
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

export default ModelComparison;
