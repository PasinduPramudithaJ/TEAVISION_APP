import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import { FiUpload, FiScissors, FiZap, FiTrash2, FiDownload, FiArrowLeft, FiHome, FiCheckCircle, FiX } from "react-icons/fi";

interface CroppedImage {
  file: File;
  previewUrl: string;
  croppedUrl?: string;
  prediction?: string;
  confidence?: number;
  error?: string;
}

const CropLiquorImages: React.FC = () => {
  const [images, setImages] = useState<CroppedImage[]>([]);
  const [isCropping, setIsCropping] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [dragActive, setDragActive] = useState(false);
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

  const handleCropAll = async () => {
    if (images.length === 0) return alert("Please upload images first!");
    setIsCropping(true);
    try {
      const results = await Promise.all(
        images.map(async (img) => {
          const formData = new FormData();
          formData.append("file", img.file);
          try {
            const res = await fetch(`${apiUrl}/crop_reflection`, { method: "POST", body: formData });
            if (!res.ok) {
              const errorData = await safeJsonParse(res);
              throw new Error(errorData.error || `HTTP ${res.status}`);
            }
            const data = await safeJsonParse(res);
            if (data.error) throw new Error(data.error);
            return { ...img, croppedUrl: data.cropped_image };
          } catch (error: any) {
            return { ...img, error: error.message || "Cropping failed" };
          }
        })
      );
      setImages(results);
    } finally {
      setIsCropping(false);
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

  const handlePredictSingle = async (img: CroppedImage) => {
    if (!img.croppedUrl) return alert("No cropped image available for prediction!");
    setIsPredicting(true);
    const userEmail = getUserEmail();
    try {
      const base64 = img.croppedUrl.split(",")[1];
      const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: "image/png" });
      const croppedFile = new File([blob], img.file.name, { type: "image/png" });

      const formData = new FormData();
      formData.append("file", croppedFile);

      const headers: HeadersInit = {};
      if (userEmail) {
        headers["X-User-Email"] = userEmail;
      }
      const res = await fetch(`${apiUrl}/predict?type=preprocessed`, { 
        method: "POST", 
        body: formData,
        headers
      });
      if (!res.ok) {
        const errorData = await safeJsonParse(res);
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      const data = await safeJsonParse(res);
      if (data.error) throw new Error(data.error);

      setImages((prev) =>
        prev.map((i) => (i.file.name === img.file.name ? { ...i, prediction: data.prediction, confidence: data.confidence } : i))
      );
    } catch (error: any) {
      setImages((prev) => prev.map((i) => (i.file.name === img.file.name ? { ...i, error: error.message || "Prediction failed" } : i)));
    } finally {
      setIsPredicting(false);
    }
  };

  const handlePredictAll = async () => {
    const croppedImgs = images.filter((img) => img.croppedUrl);
    if (croppedImgs.length === 0) return alert("No cropped images to predict!");
    setIsPredicting(true);
    const userEmail = getUserEmail();
    try {
      const results = await Promise.all(
        croppedImgs.map(async (img) => {
          try {
            const base64 = img.croppedUrl!.split(",")[1];
            const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: "image/png" });
            const croppedFile = new File([blob], img.file.name, { type: "image/png" });

            const formData = new FormData();
            formData.append("file", croppedFile);

            const headers: HeadersInit = {};
            if (userEmail) {
              headers["X-User-Email"] = userEmail;
            }
            const res = await fetch(`${apiUrl}/predict?type=preprocessed`, { 
              method: "POST", 
              body: formData,
              headers
            });
            if (!res.ok) {
              const errorData = await safeJsonParse(res);
              return { ...img, error: errorData.error || `HTTP ${res.status}` };
            }
            const data = await safeJsonParse(res);
            if (data.error) {
              return { ...img, error: data.error };
            }
            return { ...img, prediction: data.prediction, confidence: data.confidence };
          } catch (error: any) {
            return { ...img, error: error.message || "Prediction failed" };
          }
        })
      );

      setImages((prev) =>
        prev.map((img) => {
          const updated = results.find((r) => r.file.name === img.file.name);
          return updated || img;
        })
      );
    } finally {
      setIsPredicting(false);
    }
  };

  const handleClear = () => setImages([]);

  const handleDownloadSingle = (croppedUrl: string, name: string) => {
    const link = document.createElement("a");
    link.href = croppedUrl;
    link.download = `cropped_${name}`;
    link.click();
  };

  const handleDownloadAllZip = async () => {
    const zip = new JSZip();
    const croppedImgs = images.filter((img) => img.croppedUrl);

    if (croppedImgs.length === 0) return alert("No cropped images available!");

    for (const img of croppedImgs) {
      const base64Data = img.croppedUrl!.split(",")[1];
      zip.file(`cropped_${img.file.name}`, base64Data, { base64: true });
    }

    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, "cropped_images.zip");
  };

  const croppedCount = images.filter((img) => img.croppedUrl).length;
  const predictedCount = images.filter((img) => img.prediction).length;

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
          ✂️ Tea Liquor Image Cropper & Predictor
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
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-primary mb-0">{images.length}</h3>
                    <small className="text-muted">Total Images</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-success mb-0">{croppedCount}</h3>
                    <small className="text-muted">Cropped</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-info mb-0">{predictedCount}</h3>
                    <small className="text-muted">Predicted</small>
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
            {/* Drag and Drop */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-4 p-5 text-center mb-4 ${
                dragActive ? "border-success bg-light" : "border-secondary"
              }`}
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
                background: dragActive ? "rgba(40, 167, 69, 0.1)" : "transparent",
              }}
              onClick={() => document.getElementById("file-input-crop")?.click()}
            >
              <FiUpload className="display-4 text-muted mb-3" />
              <p className="text-muted mb-2 fw-bold">
                {dragActive ? "Drop your images here" : "Drag & drop or click to upload tea liquor images"}
              </p>
              <input
                id="file-input-crop"
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
                onClick={handleCropAll}
                disabled={isCropping || isPredicting || images.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCropping ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Cropping...
                  </>
                ) : (
                  <>
                    <FiScissors /> Crop All
                  </>
                )}
              </motion.button>
              <motion.button
                className="btn btn-warning btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                onClick={handlePredictAll}
                disabled={isPredicting || isCropping || croppedCount === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isPredicting ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    Predicting...
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
              {croppedCount > 0 && (
                <button
                  className="btn btn-success btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                  onClick={handleDownloadAllZip}
                >
                  <FiDownload /> Download ZIP
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="container mt-4"
            style={{ maxWidth: "1200px" }}
          >
            <h4 className="text-white mb-4 fw-bold">📸 Cropping & Prediction Results</h4>
            <div className="row g-4">
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  className="col-md-6 col-lg-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="card border-0 shadow-lg h-100" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <small className="text-muted fw-bold" style={{ fontSize: "0.75rem" }}>
                          {img.file.name.length > 20 ? img.file.name.substring(0, 20) + "..." : img.file.name}
                        </small>
                        {img.croppedUrl ? (
                          <span className="badge bg-success rounded-pill">
                            <FiCheckCircle /> Cropped
                          </span>
                        ) : img.error ? (
                          <span className="badge bg-danger rounded-pill">
                            <FiX /> Failed
                          </span>
                        ) : (
                          <span className="badge bg-warning rounded-pill">Waiting</span>
                        )}
                      </div>

                      {/* Image Comparison */}
                      <div className="d-flex gap-2 mb-3">
                        <div className="flex-grow-1 text-center">
                          <small className="text-muted d-block mb-1">Original</small>
                          <img
                            src={img.previewUrl}
                            alt="original"
                            className="img-fluid rounded shadow"
                            style={{ maxHeight: "100px", width: "100%", objectFit: "cover" }}
                          />
                        </div>
                        {img.croppedUrl && (
                          <div className="flex-grow-1 text-center">
                            <small className="text-muted d-block mb-1">Cropped</small>
                            <img
                              src={img.croppedUrl}
                              alt="cropped"
                              className="img-fluid rounded shadow"
                              style={{ maxHeight: "100px", width: "100%", objectFit: "cover" }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Prediction Result */}
                      {img.prediction && (
                        <div className="alert alert-success rounded-pill mb-2 p-2 text-center">
                          <strong>{img.prediction}</strong>
                          {img.confidence && (
                            <div className="small">{(img.confidence * 100).toFixed(1)}% confidence</div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="d-flex gap-2 flex-wrap">
                        {img.croppedUrl && (
                          <>
                            <button
                              className="btn btn-sm btn-outline-success rounded-pill flex-grow-1"
                              onClick={() => handleDownloadSingle(img.croppedUrl!, img.file.name)}
                            >
                              <FiDownload className="me-1" />
                              Download
                            </button>
                            <button
                              className="btn btn-sm btn-outline-warning rounded-pill flex-grow-1"
                              onClick={() => handlePredictSingle(img)}
                              disabled={isPredicting}
                            >
                              <FiZap className="me-1" />
                              Predict
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
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

export default CropLiquorImages;
