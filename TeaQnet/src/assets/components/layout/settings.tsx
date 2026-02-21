import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiSettings, FiSave, FiArrowLeft, FiServer, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";

const Settings: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"success" | "error" | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) {
      setApiUrl(savedUrl);
    }
  }, []);

  const testConnection = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        setTestStatus("success");
        setTimeout(() => setTestStatus(null), 3000);
      } else {
        setTestStatus("error");
        setTimeout(() => setTestStatus(null), 3000);
      }
    } catch {
      setTestStatus("error");
      setTimeout(() => setTestStatus(null), 3000);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem("backend_url", apiUrl);
    alert("✅ API URL saved successfully!");
    navigate("/super");
  };

  return (
    <>
      <Header />
      <div
        className="min-vh-100 py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          paddingTop: "100px",
        }}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="row justify-content-center"
          >
            <div className="col-md-8 col-lg-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card shadow-lg border-0"
                style={{
                  borderRadius: "25px",
                  background: "rgba(255, 255, 255, 0.95)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div className="card-body p-5">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "80px",
                        height: "80px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      }}
                    >
                      <FiSettings size={40} className="text-white" />
                    </div>
                    <h2 className="fw-bold mb-2">API Settings</h2>
                    <p className="text-muted">Configure your backend API connection</p>
                  </div>

                  {/* API URL Input */}
                  <div className="mb-4">
                    <label className="form-label fw-bold d-flex align-items-center gap-2">
                      <FiServer className="text-primary" />
                      Backend API URL
                    </label>
                    <div className="input-group input-group-lg">
                      <span className="input-group-text bg-light">
                        <FiServer />
                      </span>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        value={apiUrl}
                        onChange={(e) => {
                          setApiUrl(e.target.value);
                          setTestStatus(null);
                        }}
                        placeholder="http://127.0.0.1:5000"
                        style={{ borderRadius: "0 10px 10px 0" }}
                      />
                    </div>
                    <small className="text-muted mt-2 d-block">
                      Enter the full URL of your backend API server
                    </small>
                  </div>

                  {/* Test Connection */}
                  <div className="mb-4">
                    <button
                      className="btn btn-outline-primary w-100 rounded-pill py-2"
                      onClick={testConnection}
                      disabled={isTesting}
                    >
                      {isTesting ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          Test Connection
                        </>
                      )}
                    </button>
                    {testStatus === "success" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alert alert-success mt-3 rounded-pill d-flex align-items-center gap-2"
                      >
                        <FiCheckCircle /> Connection successful!
                      </motion.div>
                    )}
                    {testStatus === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="alert alert-danger mt-3 rounded-pill d-flex align-items-center gap-2"
                      >
                        <FiAlertCircle /> Connection failed. Please check your URL.
                      </motion.div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <motion.button
                      className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center justify-content-center gap-2"
                      onClick={handleSave}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiSave /> Save & Back
                    </motion.button>
                    <button
                      className="btn btn-outline-secondary rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={() => navigate("/super")}
                    >
                      <FiArrowLeft /> Cancel
                    </button>
                  </div>

                  {/* Info Card */}
                  <div className="mt-4 p-3 rounded-4" style={{ background: "rgba(102, 126, 234, 0.1)" }}>
                    <h6 className="fw-bold mb-2">💡 Tips</h6>
                    <ul className="small text-muted mb-0" style={{ paddingLeft: "20px" }}>
                      <li>Make sure your backend server is running</li>
                      <li>Use the full URL including http:// or https://</li>
                      <li>Test the connection before saving</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Settings;
