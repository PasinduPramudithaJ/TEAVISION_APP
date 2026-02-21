import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiTrash2, FiArrowLeft, FiHome, FiCheckCircle, FiX, FiBarChart2, FiDownload, FiFolder, FiActivity } from "react-icons/fi";

interface ImageAnalysis {
  file: File;
  previewUrl: string;
  imageType: "raw" | "cropped";
  croppedUrl?: string;
  rMean?: number;
  gMean?: number;
  bMean?: number;
  error?: string;
}

const ImageRGBAnalysis: React.FC = () => {
  const [images, setImages] = useState<ImageAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [dragActive, setDragActive] = useState(false);
  const [imageType, setImageType] = useState<"raw" | "cropped">("raw");
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  const calculateRGBFromImage = async (imageUrl: string): Promise<{ r: number; g: number; b: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let rSum = 0, gSum = 0, bSum = 0, pixelCount = 0;
        
        // Calculate means, skipping fully transparent pixels
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha > 0) {
            rSum += data[i];
            gSum += data[i + 1];
            bSum += data[i + 2];
            pixelCount++;
          }
        }
        
        if (pixelCount === 0) {
          reject(new Error("No valid pixels found"));
          return;
        }
        
        resolve({
          r: rSum / pixelCount,
          g: gSum / pixelCount,
          b: bSum / pixelCount,
        });
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = imageUrl;
    });
  };

  const processFiles = async (files: FileList | File[]): Promise<ImageAnalysis[]> => {
    const fileArray = Array.from(files);
    // Filter only image files
    const imageFiles = fileArray.filter(file => file.type.startsWith("image/"));
    
    const uploaded: ImageAnalysis[] = [];
    
    for (const file of imageFiles) {
      const previewUrl = URL.createObjectURL(file);
      
      if (imageType === "cropped") {
        // For cropped images, calculate RGB immediately on frontend
        try {
          const rgbValues = await calculateRGBFromImage(previewUrl);
          uploaded.push({
            file,
            previewUrl,
            imageType: "cropped",
            croppedUrl: previewUrl, // Use the same image as cropped
            rMean: rgbValues.r,
            gMean: rgbValues.g,
            bMean: rgbValues.b,
          });
        } catch (error: any) {
          uploaded.push({
            file,
            previewUrl,
            imageType: "cropped",
            croppedUrl: previewUrl,
            error: error.message || "Failed to calculate RGB values",
          });
        }
      } else {
        // For raw images, just add to list (will be processed later)
        uploaded.push({
          file,
          previewUrl,
          imageType: "raw",
        });
      }
    }
    
    return uploaded;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const uploaded = await processFiles(files);

    setImages((prev) => {
      const existingKeys = new Set(prev.map((img) => img.file.name + img.file.size));
      const unique = uploaded.filter((img) => !existingKeys.has(img.file.name + img.file.size));
      return [...prev, ...unique];
    });

    e.target.value = "";
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Process all files from the folder (webkitdirectory includes all files recursively)
    const uploaded = await processFiles(files);

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

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const uploaded = await processFiles(e.dataTransfer.files);
      if (uploaded.length > 0) {
        setImages((prev) => {
          const existingKeys = new Set(prev.map((img) => img.file.name + img.file.size));
          const unique = uploaded.filter((img) => !existingKeys.has(img.file.name + img.file.size));
          return [...prev, ...unique];
        });
      }
    }
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

  const handleAnalyzeAll = async () => {
    if (images.length === 0) return alert("Please upload images first!");
    setIsAnalyzing(true);
    try {
      const results = await Promise.all(
        images.map(async (img) => {
          // Skip already analyzed images (cropped images processed on frontend)
          if (img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined) {
            return img;
          }
          
          // Only process raw images that haven't been analyzed
          if (img.imageType === "raw") {
            const formData = new FormData();
            formData.append("file", img.file);
            try {
              const res = await fetch(`${apiUrl}/analyze_rgb`, { method: "POST", body: formData });
              if (!res.ok) {
                const errorData = await safeJsonParse(res);
                throw new Error(errorData.error || `HTTP ${res.status}`);
              }
              const data = await safeJsonParse(res);
              if (data.error) throw new Error(data.error);
              return {
                ...img,
                croppedUrl: data.cropped_image,
                rMean: data.r_mean,
                gMean: data.g_mean,
                bMean: data.b_mean,
              };
            } catch (error: any) {
              return { ...img, error: error.message || "Analysis failed" };
            }
          }
          
          return img;
        })
      );
      setImages(results);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeSingle = async (img: ImageAnalysis) => {
    setIsAnalyzing(true);
    try {
      if (img.imageType === "raw") {
        const formData = new FormData();
        formData.append("file", img.file);
        const res = await fetch(`${apiUrl}/analyze_rgb`, { method: "POST", body: formData });
        if (!res.ok) {
          const errorData = await safeJsonParse(res);
          throw new Error(errorData.error || `HTTP ${res.status}`);
        }
        const data = await safeJsonParse(res);
        if (data.error) throw new Error(data.error);

        setImages((prev) =>
          prev.map((i) =>
            i.file.name === img.file.name
              ? {
                  ...i,
                  croppedUrl: data.cropped_image,
                  rMean: data.r_mean,
                  gMean: data.g_mean,
                  bMean: data.b_mean,
                }
              : i
          )
        );
      } else {
        // For cropped images, calculate RGB on frontend
        const rgbValues = await calculateRGBFromImage(img.previewUrl);
        setImages((prev) =>
          prev.map((i) =>
            i.file.name === img.file.name
              ? {
                  ...i,
                  croppedUrl: img.previewUrl,
                  rMean: rgbValues.r,
                  gMean: rgbValues.g,
                  bMean: rgbValues.b,
                }
              : i
          )
        );
      }
    } catch (error: any) {
      setImages((prev) =>
        prev.map((i) => (i.file.name === img.file.name ? { ...i, error: error.message || "Analysis failed" } : i))
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadCSV = () => {
    const rows = [
      ["Filename",/* "Image Type", */ "R_Mean", "G_Mean", "B_Mean",/* "Status" */],
      ...images.map((img) => [
        img.file.name,
        //img.imageType,
        img.rMean !== undefined ? img.rMean.toFixed(2) : "",
        img.gMean !== undefined ? img.gMean.toFixed(2) : "",
        img.bMean !== undefined ? img.bMean.toFixed(2) : "",
       // img.error ? `Error: ${img.error}` : img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined ? "Analyzed" : "Pending",
      ]),
    ];

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `rgb_analysis_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => setImages([]);

  const analyzedCount = images.filter((img) => img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined).length;

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
          📊 RGB Mean Analysis
        </motion.h2>

        {/* Stats Cards */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="container mb-4"
            style={{ maxWidth: "1000px" }}
          >
            <div className="row g-3">
              <div className="col-md-6">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-primary mb-0">{images.length}</h3>
                    <small className="text-muted">Total Images</small>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-success mb-0">{analyzedCount}</h3>
                    <small className="text-muted">Analyzed</small>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Control Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
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
            {/* Image Type Selection */}
            <div className="mb-3">
              <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>Image Type:</label>
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="imageType"
                  id="rawType"
                  checked={imageType === "raw"}
                  onChange={() => setImageType("raw")}
                />
                <label className="btn btn-outline-primary" htmlFor="rawType" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
                  Raw Image
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="imageType"
                  id="croppedType"
                  checked={imageType === "cropped"}
                  onChange={() => setImageType("cropped")}
                />
                <label className="btn btn-outline-primary" htmlFor="croppedType" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
                  Cropped Image
                </label>
              </div>
              <small className="text-muted d-block mt-2" style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)" }}>
                {imageType === "raw" 
                  ? "Select raw images to crop and analyze (processed on backend)" 
                  : "Select pre-cropped images to analyze (processed on frontend)"}
              </small>
            </div>

            {/* Upload Mode Selection */}
            <div className="mb-3">
              <label className="form-label fw-bold text-dark mb-2" style={{ fontSize: "clamp(0.9rem, 2vw, 1rem)" }}>Upload Mode:</label>
              <div className="btn-group w-100" role="group">
                <input
                  type="radio"
                  className="btn-check"
                  name="uploadMode"
                  id="filesMode"
                  checked={uploadMode === "files"}
                  onChange={() => setUploadMode("files")}
                />
                <label className="btn btn-outline-secondary" htmlFor="filesMode" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
                  <FiUpload className="me-1" /> Select Files
                </label>
                <input
                  type="radio"
                  className="btn-check"
                  name="uploadMode"
                  id="folderMode"
                  checked={uploadMode === "folder"}
                  onChange={() => setUploadMode("folder")}
                />
                <label className="btn btn-outline-secondary" htmlFor="folderMode" style={{ fontSize: "clamp(0.85rem, 2vw, 0.95rem)" }}>
                  <FiFolder className="me-1" /> Select Folder
                </label>
              </div>
              <small className="text-muted d-block mt-2" style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.85rem)" }}>
                {uploadMode === "files" 
                  ? "Select individual image files" 
                  : "Select a folder to import all images from it (including subfolders)"}
              </small>
            </div>

            {/* Drag and Drop */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-3 p-3 p-md-4 text-center mb-3 ${
                dragActive ? "border-success bg-light" : "border-secondary"
              }`}
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
                background: dragActive ? "rgba(40, 167, 69, 0.1)" : "transparent",
              }}
              onClick={() => {
                if (uploadMode === "folder") {
                  document.getElementById("folder-input-rgb")?.click();
                } else {
                  document.getElementById("file-input-rgb")?.click();
                }
              }}
            >
              {uploadMode === "folder" ? (
                <FiFolder className="mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }} />
              ) : (
                <FiUpload className="mb-2" style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }} />
              )}
              <p className="text-muted mb-2 fw-bold" style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)" }}>
                {dragActive 
                  ? "Drop your images here" 
                  : uploadMode === "folder"
                  ? `Click to select a folder (all ${imageType} images will be imported)`
                  : `Drag & drop or click to upload ${imageType} images`}
              </p>
              <input
                id="file-input-rgb"
                type="file"
                accept="image/*"
                multiple
                onChange={handleUpload}
                className="d-none"
              />
              <input
                id="folder-input-rgb"
                type="file"
                multiple
                onChange={handleFolderUpload}
                className="d-none"
                {...({ webkitdirectory: "", directory: "" } as any)}
              />
            </div>

            {/* Action Buttons */}
            <div className="d-flex justify-content-center flex-wrap gap-2">
              <motion.button
                className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                onClick={handleAnalyzeAll}
                disabled={isAnalyzing || images.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isAnalyzing ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FiBarChart2 /> Analyze All
                  </>
                )}
                
              </motion.button>
              {images.filter((img) => img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined).length > 0 && (
                <button
                  className="btn btn-success btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                  onClick={() => { handleDownloadCSV(); navigate('/taste-predict-csv'); }}
                >
                  <FiDownload /> Download CSV
                </button>
              )}
              <button
                className="btn btn-danger btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                onClick={handleClear}
                disabled={images.length === 0}
              >
                <FiTrash2 /> Clear All
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results Table */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4"
            style={{ maxWidth: "1400px" }}
          >
            <h4 className="text-white mb-4 fw-bold">📸 Analysis Results</h4>
            <div className="card shadow-lg border-0" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th style={{ width: "5%" }}>#</th>
                        <th style={{ width: "15%" }}>Original Image</th>
                        <th style={{ width: "15%" }}>Cropped Image</th>
                        <th style={{ width: "20%" }}>Filename</th>
                        <th style={{ width: "10%" }}>Type</th>
                        <th style={{ width: "10%" }}>R Mean</th>
                        <th style={{ width: "10%" }}>G Mean</th>
                        <th style={{ width: "10%" }}>B Mean</th>
                        <th style={{ width: "10%" }}>Status</th>
                        <th style={{ width: "5%" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {images.map((img, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <img
                              src={img.previewUrl}
                              alt="original"
                              className="img-thumbnail"
                              style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                            />
                          </td>
                          <td>
                            {img.croppedUrl ? (
                              <img
                                src={img.croppedUrl}
                                alt="cropped"
                                className="img-thumbnail"
                                style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                              />
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <small className="fw-bold">{img.file.name}</small>
                          </td>
                          <td>
                            <span className={`badge ${img.imageType === "raw" ? "bg-info" : "bg-success"}`}>
                              {img.imageType}
                            </span>
                          </td>
                          <td>
                            {img.rMean !== undefined ? (
                              <span className="fw-bold text-danger">{img.rMean.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {img.gMean !== undefined ? (
                              <span className="fw-bold text-success">{img.gMean.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {img.bMean !== undefined ? (
                              <span className="fw-bold text-primary">{img.bMean.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {img.error ? (
                              <span className="badge bg-danger rounded-pill">
                                <FiX /> Error
                              </span>
                            ) : img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined ? (
                              <span className="badge bg-success rounded-pill">
                                <FiCheckCircle /> Done
                              </span>
                            ) : (
                              <span className="badge bg-warning rounded-pill">Pending</span>
                            )}
                          </td>
                          <td>
                            {!(img.rMean !== undefined && img.gMean !== undefined && img.bMean !== undefined) && (
                              <button
                                className="btn btn-sm btn-outline-primary rounded-pill"
                                onClick={() => handleAnalyzeSingle(img)}
                                disabled={isAnalyzing}
                                title="Analyze this image"
                              >
                                <FiBarChart2 />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {images.some((img) => img.error) && (
                  <div className="mt-3">
                    <h6 className="text-danger">Errors:</h6>
                    {images
                      .filter((img) => img.error)
                      .map((img, idx) => (
                        <div key={idx} className="alert alert-danger mb-2 py-2">
                          <strong>{img.file.name}:</strong> {img.error}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-5 d-flex justify-content-center flex-wrap gap-3"
        >
          <button className="btn btn-outline-light rounded-pill px-4" onClick={() => navigate(-1)}>
            <FiArrowLeft className="me-2" />
            Back
          </button>
          <button className="btn btn-outline-light" onClick={() => navigate('/taste-predict-csv')}>
            <FiActivity /> TIM Predict
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

export default ImageRGBAnalysis;
