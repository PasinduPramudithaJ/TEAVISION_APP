import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Bar, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiArrowLeft, FiDownload, FiRefreshCw, FiCalendar, FiTrendingUp, FiBarChart2, FiTrash2, FiUsers, FiSearch, FiX } from "react-icons/fi";
import image1 from "../../images/background2.jpg";
import Header from "./Header";
import Footer from "./Footer";
import { getAllHistory, downloadAdminReport, deleteAllHistory, PredictionHistory } from "../../../utils/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminHistory: React.FC = () => {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<PredictionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllHistory();
      setHistory(data);
      setFilteredHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter history by user email
  useEffect(() => {
    let filtered = history;
    
    if (selectedUser) {
      filtered = filtered.filter(item => 
        item.user_email?.toLowerCase().includes(selectedUser.toLowerCase())
      );
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.prediction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredHistory(filtered);
  }, [history, selectedUser, searchTerm]);

  // Get unique user emails for filter dropdown
  const uniqueUsers = Array.from(new Set(history.map(item => item.user_email).filter(Boolean))).sort();

  const handleDownloadReport = async () => {
    try {
      await downloadAdminReport();
    } catch (err: any) {
      alert("Failed to download report: " + err.message);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllHistory();
      setShowDeleteConfirm(false);
      await loadHistory();
      alert("All history deleted successfully");
    } catch (err: any) {
      alert("Failed to delete history: " + err.message);
    }
  };

  // Prepare chart data (use filteredHistory for charts)
  const predictionCounts: Record<string, number> = {};
  const userActivity: Record<string, number> = {};
  const confidenceOverTime: { date: string; confidence: number }[] = [];
  const modelUsage: Record<string, number> = {};

  filteredHistory.forEach((item) => {
    // Count predictions
    predictionCounts[item.prediction] = (predictionCounts[item.prediction] || 0) + 1;
    
    // User activity
    if (item.user_email) {
      userActivity[item.user_email] = (userActivity[item.user_email] || 0) + 1;
    }
    
    // Confidence over time
    const date = new Date(item.created_at).toLocaleDateString();
    confidenceOverTime.push({ date, confidence: item.confidence * 100 });
    
    // Model usage
    modelUsage[item.model_name] = (modelUsage[item.model_name] || 0) + 1;
  });

  const barChartData = {
    labels: Object.keys(predictionCounts),
    datasets: [
      {
        label: "Number of Predictions",
        data: Object.values(predictionCounts),
        backgroundColor: [
          "rgba(255, 111, 97, 0.8)",
          "rgba(107, 91, 149, 0.8)",
          "rgba(136, 176, 75, 0.8)",
          "rgba(255, 165, 0, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
        ],
        borderRadius: 12,
      },
    ],
  };

  const userActivityData = {
    labels: Object.keys(userActivity).slice(0, 10), // Top 10 users
    datasets: [
      {
        label: "Predictions",
        data: Object.keys(userActivity).slice(0, 10).map(email => userActivity[email]),
        backgroundColor: "rgba(54, 162, 235, 0.8)",
        borderRadius: 12,
      },
    ],
  };

  const lineChartData = {
    labels: confidenceOverTime.map((_, i) => `Prediction ${i + 1}`),
    datasets: [
      {
        label: "Confidence (%)",
        data: confidenceOverTime.map((item) => item.confidence),
        borderColor: "rgba(40, 167, 69, 1)",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const doughnutData = {
    labels: Object.keys(modelUsage),
    datasets: [
      {
        data: Object.values(modelUsage),
        backgroundColor: [
          "rgba(255, 111, 97, 0.8)",
          "rgba(107, 91, 149, 0.8)",
          "rgba(136, 176, 75, 0.8)",
          "rgba(255, 165, 0, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
        ],
        borderWidth: 3,
        borderColor: "rgba(255, 255, 255, 0.2)",
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "white", font: { size: 12 } },
        position: "top" as const,
      },
      title: {
        display: true,
        color: "white",
        font: { size: 16, weight: "bold" as const },
      },
    },
    scales: {
      x: {
        ticks: { color: "white", font: { size: 11 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "white", font: { size: 11 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        beginAtZero: true,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        max: 100,
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "white", font: { size: 11 } },
        position: "bottom" as const,
      },
      title: {
        display: true,
        color: "white",
        font: { size: 16, weight: "bold" as const },
      },
    },
  };

  return (
    <>
      <Header />
      <div
        className="container-fluid d-flex flex-column align-items-center justify-content-start py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          minHeight: "100vh",
          paddingTop: "100px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="container"
          style={{ maxWidth: "1400px" }}
        >
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
            <motion.h2
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-white fw-bold mb-0"
              style={{ fontSize: "2.5rem" ,marginTop: "100px"}}
            >
              👥 All Users Prediction History
            </motion.h2>
            <div className="d-flex gap-2 flex-wrap">
              <button
                className="btn btn-success rounded-pill px-4 d-flex align-items-center gap-2"
                onClick={handleDownloadReport}
              >
                <FiDownload /> Download Report
              </button>
              <button
                className="btn btn-danger rounded-pill px-4 d-flex align-items-center gap-2"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <FiTrash2 /> Delete All
              </button>
              <button
                className="btn btn-primary rounded-pill px-4 d-flex align-items-center gap-2"
                onClick={loadHistory}
                disabled={isLoading}
              >
                <FiRefreshCw className={isLoading ? "spinner-border spinner-border-sm" : ""} /> Refresh
              </button>
              <button
                className="btn btn-outline-light rounded-pill px-4"
                onClick={() => navigate("/super")}
              >
                <FiArrowLeft /> Back
              </button>
            </div>
          </div>

          {/* Filter Section */}
          {history.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-0 shadow-lg mb-4"
              style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}
            >
              <div className="card-body p-4">
                <div className="row g-3 align-items-end">
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Filter by User</label>
                    <select
                      className="form-select"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                    >
                      <option value="">All Users</option>
                      {uniqueUsers.map((email) => (
                        <option key={email} value={email}>
                          {email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Search</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <FiSearch />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by prediction, model, or user email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearchTerm("")}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-md-2">
                    <button
                      className="btn btn-outline-secondary w-100"
                      onClick={() => {
                        setSelectedUser("");
                        setSearchTerm("");
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <small className="text-muted">
                    Showing {filteredHistory.length} of {history.length} predictions
                  </small>
                </div>
              </div>
            </motion.div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Confirm Delete</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setShowDeleteConfirm(false)}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <p>Are you sure you want to delete ALL prediction history? This action cannot be undone.</p>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={handleDeleteAll}
                    >
                      Delete All
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center text-white py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading history...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : history.length === 0 ? (
            <div className="card shadow-lg border-0" style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}>
              <div className="card-body text-center py-5">
                <h4 className="text-muted mb-3">No History Found</h4>
                <p className="text-muted">No predictions have been made yet.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Statistics Cards */}
              <div className="row g-4 mb-4">
                <div className="col-md-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border-0 shadow-lg h-100"
                    style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}
                  >
                    <div className="card-body text-center">
                      <FiBarChart2 className="display-4 text-primary mb-2" />
                      <h3 className="fw-bold">{filteredHistory.length}</h3>
                      <p className="text-muted mb-0">Total Predictions</p>
                      {filteredHistory.length !== history.length && (
                        <small className="text-muted">({history.length} total)</small>
                      )}
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card border-0 shadow-lg h-100"
                    style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}
                  >
                    <div className="card-body text-center">
                      <FiUsers className="display-4 text-info mb-2" />
                      <h3 className="fw-bold">{Object.keys(userActivity).length}</h3>
                      <p className="text-muted mb-0">Active Users</p>
                      {selectedUser && (
                        <small className="text-muted">(filtered)</small>
                      )}
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card border-0 shadow-lg h-100"
                    style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}
                  >
                    <div className="card-body text-center">
                      <FiTrendingUp className="display-4 text-success mb-2" />
                      <h3 className="fw-bold">
                        {filteredHistory.length > 0
                          ? (filteredHistory.reduce((sum, h) => sum + h.confidence, 0) / filteredHistory.length * 100).toFixed(1)
                          : 0}%
                      </h3>
                      <p className="text-muted mb-0">Avg Confidence</p>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card border-0 shadow-lg h-100"
                    style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}
                  >
                    <div className="card-body text-center">
                      <FiCalendar className="display-4 text-warning mb-2" />
                      <h3 className="fw-bold">{Object.keys(predictionCounts).length}</h3>
                      <p className="text-muted mb-0">Unique Regions</p>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Charts */}
              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border-0 shadow-lg"
                    style={{ borderRadius: "20px", background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)" }}
                  >
                    <div className="card-body p-4">
                      <h5 className="text-white mb-3">Prediction Distribution</h5>
                      <div style={{ height: "300px" }}>
                        <Bar data={barChartData} options={chartOptions} />
                      </div>
                    </div>
                  </motion.div>
                </div>
                <div className="col-md-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border-0 shadow-lg"
                    style={{ borderRadius: "20px", background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)" }}
                  >
                    <div className="card-body p-4">
                      <h5 className="text-white mb-3">Top Users Activity</h5>
                      <div style={{ height: "300px" }}>
                        <Bar data={userActivityData} options={chartOptions} />
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>

              <div className="row g-4 mb-4">
                <div className="col-md-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card border-0 shadow-lg"
                    style={{ borderRadius: "20px", background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)" }}
                  >
                    <div className="card-body p-4">
                      <h5 className="text-white mb-3">Model Usage</h5>
                      <div style={{ height: "300px" }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </div>
                  </motion.div>
                </div>
                {history.length > 1 && (
                  <div className="col-md-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card border-0 shadow-lg"
                      style={{ borderRadius: "20px", background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(10px)" }}
                    >
                      <div className="card-body p-4">
                        <h5 className="text-white mb-3">Confidence Over Time</h5>
                        <div style={{ height: "300px" }}>
                          <Line data={lineChartData} options={lineChartOptions} />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>

              {/* History Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card border-0 shadow-lg"
                style={{ borderRadius: "20px", background: "rgba(255, 255, 255, 0.95)" }}
              >
                <div className="card-body p-4">
                  <h5 className="mb-4">All Users Prediction History</h5>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-dark">
                        <tr>
                          <th>#</th>
                          <th>User Email</th>
                          <th>Date</th>
                          <th>Prediction</th>
                          <th>Confidence</th>
                          <th>Model</th>
                          <th>Image Type</th>
                          <th>Image</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredHistory.map((item, index) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <td className="fw-bold">{index + 1}</td>
                            <td>
                              <small>{item.user_email || "N/A"}</small>
                            </td>
                            <td>
                              <small>{new Date(item.created_at).toLocaleString()}</small>
                            </td>
                            <td>
                              <span className="badge bg-success rounded-pill px-3 py-2">
                                {item.prediction}
                              </span>
                            </td>
                            <td>
                              <span className="fw-bold" style={{ color: "#28a745" }}>
                                {(item.confidence * 100).toFixed(2)}%
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{item.model_name}</small>
                            </td>
                            <td>
                              <span className="badge bg-info rounded-pill">
                                {item.image_type}
                              </span>
                            </td>
                            <td>
                              {item.cropped_image && (
                                <img
                                  src={item.cropped_image.startsWith('data:') 
                                    ? item.cropped_image 
                                    : `data:image/png;base64,${item.cropped_image}`}
                                  alt="Prediction"
                                  style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }}
                                />
                              )}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default AdminHistory;

