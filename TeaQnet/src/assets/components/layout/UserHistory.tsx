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
import { FiDownload, FiRefreshCw, FiCalendar, FiBarChart2, FiArrowLeft } from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import { getUserHistory, downloadUserReport, PredictionHistory } from "../../../utils/api";

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

const UserHistory: React.FC = () => {
  const [history, setHistory] = useState<PredictionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadUserReport();
      // Show success message
      alert("Report downloaded successfully!");
    } catch (err: any) {
      alert("Failed to download: " + err.message);
    } finally {
      setDownloading(false);
    }
  };

  // Prepare data for charts
  const predictionCounts: Record<string, number> = {};
  const confidenceOverTime: { date: string; confidence: number }[] = [];
  const modelUsage: Record<string, number> = {};
  const predictionTypeCounts: Record<string, number> = {};

  history.forEach((item) => {
    // Prediction counts
    const pred = item.prediction_result;
    predictionCounts[pred] = (predictionCounts[pred] || 0) + 1;

    // Confidence over time
    if (item.confidence) {
      confidenceOverTime.push({
        date: new Date(item.created_at).toLocaleDateString(),
        confidence: item.confidence * 100,
      });
    }

    // Model usage
    const model = item.model_name || "Unknown";
    modelUsage[model] = (modelUsage[model] || 0) + 1;

    // Prediction type counts
    const type = item.prediction;
    predictionTypeCounts[type] = (predictionTypeCounts[type] || 0) + 1;
  });

  // Sort confidence over time by date
  confidenceOverTime.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const predictionChartData = {
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
        borderRadius: 8,
      },
    ],
  };

  const confidenceChartData = {
    labels: confidenceOverTime.map((item) => item.date),
    datasets: [
      {
        label: "Confidence (%)",
        data: confidenceOverTime.map((item) => item.confidence),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const modelChartData = {
    labels: Object.keys(modelUsage),
    datasets: [
      {
        data: Object.values(modelUsage),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
          "rgba(255, 159, 64, 0.8)",
        ],
        borderWidth: 2,
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
    },
    scales: {
      x: {
        ticks: { color: "white", font: { size: 11 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "white", font: { size: 11 } },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: "white", font: { size: 12 } },
        position: "right" as const,
      },
    },
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <Header />
      <div className="container-fluid flex-grow-1 py-4 mb-4">
        <div className="row justify-content-center">
          <div className="col-12 col-xl-11">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card shadow-lg border-0"
              style={{ borderRadius: "20px", backgroundColor: "rgba(255, 255, 255, 0.95)", marginTop: "20px" }}
            >
              <div className="card-header bg-transparent border-0 p-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div className="d-flex align-items-center gap-3 mb-2 mb-md-0">
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => navigate("/dashboard")}
                      title="Back to Dashboard"
                    >
                      <FiArrowLeft className="me-1" /> Back
                    </button>
                    <div>
                      <h2 className="mb-1 fw-bold text-dark">
                        <FiCalendar className="me-2" />
                        Prediction History
                      </h2>
                      <p className="text-muted mb-0">View all your prediction results and analytics</p>
                    </div>
                  </div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      className="btn btn-outline-primary"
                      onClick={loadHistory}
                      disabled={loading}
                    >
                      <FiRefreshCw className={loading ? "spinning" : ""} /> Refresh
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={handleDownload}
                      disabled={downloading || history.length === 0}
                    >
                      <FiDownload /> {downloading ? "Downloading..." : "Download Report"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="card-body p-4">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger">{error}</div>
                ) : history.length === 0 ? (
                  <div className="text-center py-5">
                    <FiBarChart2 size={64} className="text-muted mb-3" />
                    <h4 className="text-muted">No predictions yet</h4>
                    <p className="text-muted">Start making predictions to see your history here.</p>
                    <button className="btn btn-primary mt-3" onClick={() => navigate("/dashboard")}>
                      Go to Dashboard
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Statistics Cards */}
                    <div className="row mb-4">
                      <div className="col-md-3 mb-3">
                        <div className="card bg-primary text-white h-100">
                          <div className="card-body">
                            <h6 className="text-uppercase">Total Predictions</h6>
                            <h2 className="mb-0">{history.length}</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="card bg-success text-white h-100">
                          <div className="card-body">
                            <h6 className="text-uppercase">Avg Confidence</h6>
                            <h2 className="mb-0">
                              {history.filter((h) => h.confidence).length > 0
                                ? (
                                    history
                                      .filter((h) => h.confidence)
                                      .reduce((sum, h) => sum + (h.confidence || 0), 0) /
                                    history.filter((h) => h.confidence).length * 100
                                  ).toFixed(1)
                                : "0"}
                              %
                            </h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="card bg-info text-white h-100">
                          <div className="card-body">
                            <h6 className="text-uppercase">Unique Regions</h6>
                            <h2 className="mb-0">{Object.keys(predictionCounts).length}</h2>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 mb-3">
                        <div className="card bg-warning text-white h-100">
                          <div className="card-body">
                            <h6 className="text-uppercase">Models Used</h6>
                            <h2 className="mb-0">{Object.keys(modelUsage).length}</h2>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="row mb-4">
                      <div className="col-md-6 mb-4">
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title">Prediction Distribution</h5>
                            <div style={{ height: "300px" }}>
                              <Bar data={predictionChartData} options={chartOptions} />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6 mb-4">
                        <div className="card h-100">
                          <div className="card-body">
                            <h5 className="card-title">Model Usage</h5>
                            <div style={{ height: "300px" }}>
                              <Doughnut data={modelChartData} options={doughnutOptions} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {confidenceOverTime.length > 0 && (
                      <div className="row mb-4">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-body">
                              <h5 className="card-title">Confidence Over Time</h5>
                              <div style={{ height: "300px" }}>
                                <Line data={confidenceChartData} options={chartOptions} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* History Table */}
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Prediction History</h5>
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-dark">
                              <tr>
                                <th>Image</th>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Model</th>
                                <th>Prediction</th>
                                <th>Confidence</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {history.map((item, index) => (
                                <motion.tr
                                  key={item.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <td>
                                    {item.cropped_image ? (
                                      <img
                                        src={item.cropped_image.startsWith('data:') 
                                          ? item.cropped_image 
                                          : `data:image/png;base64,${item.cropped_image}`}
                                        alt="Prediction"
                                        style={{
                                          width: "60px",
                                          height: "60px",
                                          objectFit: "cover",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                        }}
                                        onClick={() => setSelectedImage(
                                          item.cropped_image?.startsWith('data:') 
                                            ? item.cropped_image 
                                            : `data:image/png;base64,${item.cropped_image}` || null
                                        )}
                                        className="shadow-sm"
                                      />
                                    ) : (
                                      <div
                                        style={{
                                          width: "60px",
                                          height: "60px",
                                          backgroundColor: "#f0f0f0",
                                          borderRadius: "8px",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <span className="text-muted">N/A</span>
                                      </div>
                                    )}
                                  </td>
                                  <td>{new Date(item.created_at).toLocaleString()}</td>
                                  <td>
                                    <span className="badge bg-secondary">
                                      {item.prediction.replace("_", " ")}
                                    </span>
                                  </td>
                                  <td>{item.model_name || "N/A"}</td>
                                  <td>
                                    <span className="badge bg-success">{item.prediction_result}</span>
                                  </td>
                                  <td>
                                    {item.confidence
                                      ? `${(item.confidence * 100).toFixed(2)}%`
                                      : "N/A"}
                                  </td>
                                  <td>
                                    {item.cropped_image && (
                                      <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setSelectedImage(
                                          item.cropped_image?.startsWith('data:') 
                                            ? item.cropped_image 
                                            : `data:image/png;base64,${item.cropped_image}` || null
                                        )}
                                      >
                                        View Image
                                      </button>
                                    )}
                                  </td>
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h5 className="modal-title">Prediction Image</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Prediction"
                  style={{ maxWidth: "100%", height: "auto", borderRadius: "8px" }}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedImage(null)}
                >
                  Close
                </button>
                <a
                  href={selectedImage}
                  download="prediction_image.png"
                  className="btn btn-primary"
                >
                  Download Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UserHistory;

