import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import { 
  FiFolder, FiZap, FiTrash2, FiDownload, FiImage, 
  FiArrowLeft, FiHome, FiBarChart2, FiGrid, FiTrendingUp 
} from "react-icons/fi";
import {
  ScatterChart,
  Scatter,
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
  relativePath: string;
  result?: PredictionResponse;
}

type ViewMode = "table" | "tree" | "pca";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#D885F9", "#FF6B6B", "#6A4C93"];

const BatchFolderPredict: React.FC = () => {
  const [images, setImages] = useState<ImagePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [selectedModel, setSelectedModel] = useState<string>("resnet18_tea_region");
  const [selectedImageType, setSelectedImageType] = useState<string>("raw");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [pcaData, setPcaData] = useState<any[]>([]);
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // Memoize valid results to avoid unnecessary recalculations
  const validResultsForPCA = useMemo(() => {
    return images.filter(
      (img) => img.result && !img.result?.error && img.result.probabilities
    );
  }, [images]);

  const computePCA = useCallback(() => {
    // Use probabilities as features for PCA visualization
    if (validResultsForPCA.length < 2) {
      setPcaData([]);
      return;
    }

    try {
      // Extract probability vectors
      const classNames = Object.keys(validResultsForPCA[0].result!.probabilities!);
      const featureMatrix = validResultsForPCA.map((img) => 
        classNames.map((cls) => img.result!.probabilities![cls] || 0)
      );

      // Center the data
      const n = featureMatrix.length;
      const m = featureMatrix[0].length;
      const mean = new Array(m).fill(0);
      
      featureMatrix.forEach((row) => {
        row.forEach((val, i) => {
          mean[i] += val;
        });
      });
      mean.forEach((_, i) => {
        mean[i] /= n;
      });

      // Center the matrix
      const centered = featureMatrix.map((row) => 
        row.map((val, i) => val - mean[i])
      );

      // Compute covariance matrix
      const covariance: number[][] = [];
      for (let i = 0; i < m; i++) {
        covariance[i] = [];
        for (let j = 0; j < m; j++) {
          let sum = 0;
          for (let k = 0; k < n; k++) {
            sum += centered[k][i] * centered[k][j];
          }
          covariance[i][j] = sum / (n - 1);
        }
      }

      // Simple 2D projection using weighted probabilities
      // This creates a meaningful 2D visualization
      const scatterData = validResultsForPCA.map((img) => {
        const probs = img.result!.probabilities!;
        const probArray = classNames.map((cls) => probs[cls] || 0);
        
        // Use weighted sum of probabilities for 2D visualization
        // This projects the probability distribution onto 2D space
        const weightedX = probArray.reduce((sum, p, i) => 
          sum + p * Math.cos((2 * Math.PI * i) / m), 0
        );
        const weightedY = probArray.reduce((sum, p, i) => 
          sum + p * Math.sin((2 * Math.PI * i) / m), 0
        );
        
        return {
          x: weightedX,
          y: weightedY,
          name: img.file.name,
          prediction: img.result!.prediction || "Unknown",
          confidence: img.result!.confidence || 0,
        };
      });

      setPcaData(scatterData);
    } catch (error) {
      console.error("PCA computation error:", error);
      setPcaData([]);
    }
  }, [validResultsForPCA]);

  useEffect(() => {
    if (viewMode === "pca" && validResultsForPCA.length >= 2) {
      computePCA();
    } else {
      setPcaData([]);
    }
  }, [viewMode, validResultsForPCA.length, computePCA]);

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles: ImagePrediction[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith("image/")) {
        imageFiles.push({
          file,
          previewUrl: URL.createObjectURL(file),
          relativePath: (file as any).webkitRelativePath || file.name,
        });
      }
    }

    setImages(imageFiles);
    e.target.value = "";

    // Auto-predict all images
    if (imageFiles.length > 0) {
      handlePredictAll(imageFiles);
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

  const handlePredictAll = async (imageList?: ImagePrediction[]) => {
    const imagesToPredict = imageList || images;
    if (imagesToPredict.length === 0) {
      alert("Please select a folder with images.");
      return;
    }

    setIsLoading(true);
    const userEmail = getUserEmail();
    
    try {
      const promises = imagesToPredict.map(async (img) => {
        const formData = new FormData();
        formData.append("file", img.file);

        try {
          const headers: HeadersInit = {};
          if (userEmail) {
            headers["X-User-Email"] = userEmail;
          }
          
          // Predict image
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

  const handleClear = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setPcaData([]);
  };

  const handleDownloadCSV = () => {
    if (images.length === 0) return;
    const csvHeader = ["Image Name", "Path", "Prediction", "Confidence", "Status"];
    const csvRows = images.map((img) => [
      img.file.name,
      img.relativePath,
      img.result?.prediction || "—",
      img.result?.confidence ? (img.result.confidence * 100).toFixed(2) + "%" : "—",
      img.result?.error ? "Failed" : img.result ? "Done" : "Waiting",
    ]);
    const csvContent = [csvHeader.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "batch_folder_predictions.csv";
    link.click();
  };

  const toggleRegion = (region: string) => {
    setExpandedRegions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(region)) {
        newSet.delete(region);
      } else {
        newSet.add(region);
      }
      return newSet;
    });
  };

  const validResults = images.filter((img) => img.result?.prediction && !img.result?.error);
  const regionGroups: Record<string, ImagePrediction[]> = {};
  validResults.forEach((img) => {
    const region = img.result!.prediction!;
    if (!regionGroups[region]) {
      regionGroups[region] = [];
    }
    regionGroups[region].push(img);
  });

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
          style={{ marginTop: "100px", fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
        >
          📁 Batch Folder Prediction
        </motion.h2>

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card shadow-lg border-0 mb-4"
          style={{
            width: "90%",
            maxWidth: "1200px",
            borderRadius: "25px",
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="card-body p-4">
            <div className="row g-3 mb-3">
              <div className="col-md-4">
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
              <div className="col-md-4">
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
              <div className="col-md-4">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiGrid className="text-success" />
                  View Mode
                </label>
                <select
                  className="form-select form-select-lg rounded-pill"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value as ViewMode)}
                >
                  <option value="table">Table View</option>
                  <option value="tree">Tree View</option>
                  <option value="pca">PCA Visualization</option>
                </select>
              </div>
            </div>

            {/* Folder Selection */}
            <div className="mb-3">
              <label className="form-label fw-bold d-flex align-items-center gap-2">
                <FiFolder className="text-warning" />
                Select Folder
              </label>
              <input
                type="file"
                {...({
                  webkitdirectory: "",
                  directory: "",
                } as React.InputHTMLAttributes<HTMLInputElement>)}
                multiple
                onChange={handleFolderSelect}
                className="form-control form-control-lg rounded-pill"
                accept="image/*"
              />
              <small className="text-muted">Select a folder containing images to predict all images automatically</small>
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center flex-wrap gap-2">
              <motion.button
                className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                onClick={() => handlePredictAll()}
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
                <button
                  className="btn btn-success btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                  onClick={handleDownloadCSV}
                >
                  <FiDownload /> Download CSV
                </button>
              )}
            </div>

            {images.length > 0 && (
              <div className="mt-3">
                <p className="text-muted mb-0">
                  <strong>{images.length}</strong> images loaded |{" "}
                  <strong>{validResults.length}</strong> predictions completed
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Table View */}
        {viewMode === "table" && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4"
            style={{ maxWidth: "1400px" }}
          >
            <div
              className="card border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-dark">📋 Prediction Results - Table View</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Image</th>
                        <th>Image Name</th>
                        <th>Path</th>
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
                          transition={{ delay: 0.5 + i * 0.02 }}
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
                            <small className="text-muted" style={{ maxWidth: "200px", display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {img.relativePath}
                            </small>
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

        {/* Tree View */}
        {viewMode === "tree" && Object.keys(regionGroups).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4"
            style={{ maxWidth: "1200px" }}
          >
            <div
              className="card border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-dark">🌳 Prediction Results - Tree View</h5>
                {Object.entries(regionGroups).map(([region, imgs]) => (
                  <div key={region} className="mb-3">
                    <button
                      className="btn btn-outline-primary w-100 text-start d-flex align-items-center justify-content-between"
                      onClick={() => toggleRegion(region)}
                      style={{ borderRadius: "10px" }}
                    >
                      <span className="fw-bold">
                        {region} ({imgs.length} {imgs.length === 1 ? "image" : "images"})
                      </span>
                      <span>{expandedRegions.has(region) ? "▼" : "▶"}</span>
                    </button>
                    {expandedRegions.has(region) && (
                      <div className="mt-2 ms-4">
                        <div className="row g-2">
                          {imgs.map((img, i) => (
                            <div key={i} className="col-md-3">
                              <div className="card border shadow-sm">
                                <img
                                  src={img.previewUrl}
                                  alt={img.file.name}
                                  className="card-img-top"
                                  style={{ height: "150px", objectFit: "cover" }}
                                />
                                <div className="card-body p-2">
                                  <small className="d-block text-truncate" title={img.file.name}>
                                    {img.file.name}
                                  </small>
                                  <span className="badge bg-success mt-1">
                                    {(img.result!.confidence! * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* PCA Visualization */}
        {viewMode === "pca" && pcaData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4"
            style={{ maxWidth: "1200px" }}
          >
            <div
              className="card border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
              }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-dark">📊 PCA Visualization</h5>
                <ResponsiveContainer width="100%" height={500}>
                  <ScatterChart>
                    <XAxis
                      type="number"
                      dataKey="x"
                      name="PC1"
                      label={{ value: "Principal Component 1", position: "insideBottom", offset: -5 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      name="PC2"
                      label={{ value: "Principal Component 2", angle: -90, position: "insideLeft" }}
                    />
                    <Tooltip
                      cursor={{ strokeDasharray: "3 3" }}
                      content={({ active, payload }) => {
                        if (active && payload && payload[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded shadow">
                              <p className="mb-1"><strong>Image:</strong> {data.name}</p>
                              <p className="mb-1"><strong>Prediction:</strong> {data.prediction}</p>
                              <p className="mb-0"><strong>Confidence:</strong> {(data.confidence * 100).toFixed(2)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    {Object.keys(regionGroups).map((region, idx) => {
                      const regionData = pcaData.filter((d) => d.prediction === region);
                      return (
                        <Scatter
                          key={region}
                          name={region}
                          data={regionData}
                          fill={COLORS[idx % COLORS.length]}
                        />
                      );
                    })}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {viewMode === "pca" && pcaData.length === 0 && images.length > 0 && (
          <div className="alert alert-info mt-4" style={{ maxWidth: "600px" }}>
            <FiTrendingUp className="me-2" />
            PCA visualization requires at least 2 images with completed predictions. Please wait for predictions to finish.
          </div>
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

export default BatchFolderPredict;

