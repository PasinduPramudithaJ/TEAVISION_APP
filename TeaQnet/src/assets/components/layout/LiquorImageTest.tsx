import React, { useState, useEffect } from "react";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import {
  FiLogOut,
  FiCamera,
  FiRefreshCw,
  FiImage,
  FiZap,
} from "react-icons/fi";

interface TeaResponse {
  is_tea_liquor: boolean;
  confidence: number;
  error?: string;
}

const LiquorImageTest: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiUrl] = useState(`http://${window.location.hostname}:5000`);
  const [result, setResult] = useState<TeaResponse | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("isSignedIn") !== "true") {
      navigate("/login");
    }
  }, [navigate]);

  /* ---------- Upload ---------- */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  /* ---------- Camera ---------- */
  const handleCaptureImage = async () => {
    const photo = await Camera.getPhoto({
      quality: 90,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    if (photo.webPath) {
      const blob = await fetch(photo.webPath).then((r) => r.blob());
      const file = new File([blob], "captured.jpg", { type: blob.type });
      setSelectedImage(file);
      setPreviewUrl(photo.webPath);
      setResult(null);
    }
  };

  /* ---------- Predict ---------- */
  const handlePredict = async () => {
    if (!selectedImage) return alert("Upload an image first");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("image", selectedImage); // 👈 Flask expects "image"

    try {
      const res = await fetch(`${apiUrl}/api/identify-tea`, {
        method: "POST",
        body: formData,
      });

      const data: TeaResponse = await res.json();
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      alert(err.message);
    }
    setIsLoading(false);
  };

  const handleClear = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <Header />
      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)),url(${image1})`,
          backgroundSize: "cover",
          minHeight: "90vh",
        }}
      >
        <div className="container">
          <motion.button
            className="btn btn-danger position-absolute top-0 end-0 m-3"
            onClick={handleLogout}
          >
            <FiLogOut /> Logout
          </motion.button>

          <h2 className="text-center text-white mb-4">
            🍵 Tea Liquor Identification
          </h2>

          <div className="row justify-content-center">
            <div className="col-md-5">
              <div className="card p-4 shadow">
                <h5 className="text-center mb-3">
                  <FiImage /> Upload / Capture Image
                </h5>

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="form-control mb-3"
                />

                <button
                  className="btn btn-warning w-100 mb-2"
                  onClick={handleCaptureImage}
                >
                  <FiCamera /> Capture Image
                </button>

                {previewUrl && (
                  <img
                    src={previewUrl}
                    className="img-fluid rounded mb-3"
                    alt="preview"
                  />
                )}

                <button
                  className="btn btn-primary w-100"
                  onClick={handlePredict}
                  disabled={isLoading}
                >
                  {isLoading ? "Analyzing..." : <><FiZap /> Identify Tea</>}
                </button>

                <button
                  className="btn btn-outline-danger w-100 mt-2"
                  onClick={handleClear}
                >
                  <FiRefreshCw /> Clear
                </button>

                {result && (
                  <div className={`alert mt-3 ${result.is_tea_liquor ? "alert-success" : "alert-danger"}`}>
                    <strong>
                      {result.is_tea_liquor ? "✔ Tea Liquor Detected" : "✖ Not a Tea Image"}
                    </strong>
                    <br />
                    Confidence: {(result.confidence * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LiquorImageTest;
