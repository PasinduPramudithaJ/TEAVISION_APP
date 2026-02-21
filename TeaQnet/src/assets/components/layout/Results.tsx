import React from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { FiArrowLeft, FiCheckCircle, FiMapPin, FiTag, FiTrendingUp } from "react-icons/fi";
import image1 from "../../images/background2.jpg";
import Header from "./Header";
import Footer from "./Footer";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Results: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { prediction, confidence, probabilities, info, croppedImage } =
    (location.state as any) || {};

  const chartData = probabilities
    ? {
        labels: Object.keys(probabilities),
        datasets: [
          {
            label: "Prediction Probability (%)",
            data: Object.keys(probabilities).map(
              (k) => (probabilities[k] || 0) * 100
            ),
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
            borderSkipped: false,
          },
        ],
      }
    : null;

  const doughnutData = probabilities
    ? {
        labels: Object.keys(probabilities),
        datasets: [
          {
            data: Object.keys(probabilities).map(
              (k) => (probabilities[k] || 0) * 100
            ),
            backgroundColor: [
              "rgba(255, 111, 97, 0.8)",
              "rgba(107, 91, 149, 0.8)",
              "rgba(136, 176, 75, 0.8)",
              "rgba(255, 165, 0, 0.8)",
              "rgba(54, 162, 235, 0.8)",
              "rgba(255, 206, 86, 0.8)",
              "rgba(75, 192, 192, 0.8)",
            ],
            borderWidth: 3,
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
        ],
      }
    : null;

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
        text: "Region Probability Distribution",
        color: "white",
        font: { size: 18, weight: "bold" as const },
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
        text: "Probability Overview",
        color: "white",
        font: { size: 16, weight: "bold" as const },
      },
    },
  };

  if (!prediction) {
    return (
      <div
        className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100 text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h3 className="mb-4">No Results Found</h3>
          <button
            className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg"
            onClick={() => navigate("/dashboard")}
          >
            Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const confidencePercentage = confidence ? (confidence * 100).toFixed(1) : "0";

  return (
    <>
      <Header />
      <div
        className="container-fluid d-flex flex-column align-items-center justify-content-center min-vh-100 py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          paddingTop: "100px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 shadow-lg text-white"
          style={{
            maxWidth: "1000px",
            width: "95%",
            borderRadius: "25px",
            backdropFilter: "blur(20px)",
            background: "rgba(0, 0, 0, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-4"
          >
            <h2 className="fw-bold mb-3" style={{ fontSize: "2.5rem" ,marginTop:"70px"}}>
              🌱 Tea Region Prediction Result
            </h2>
            <div className="d-flex justify-content-center align-items-center gap-2 mb-3">
              <div
                className="badge rounded-pill px-4 py-2"
                style={{
                  background: `linear-gradient(135deg, #28a745 0%, #20c997 100%)`,
                  fontSize: "1rem",
                }}
              >
                <FiCheckCircle className="me-2" />
                Analysis Complete
              </div>
            </div>
          </motion.div>

          {/* Image */}
          {croppedImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-4"
            >
              <div
                className="rounded-4 overflow-hidden shadow-lg mx-auto"
                style={{ maxWidth: "500px", border: "4px solid rgba(255,255,255,0.2)" }}
              >
                <img
                  src={croppedImage}
                  alt="Cropped"
                  className="img-fluid w-100"
                  style={{ display: "block" }}
                />
              </div>
            </motion.div>
          )}

          {/* Prediction Result Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card border-0 shadow-lg mb-4"
            style={{
              background: "linear-gradient(135deg, rgba(40, 167, 69, 0.2) 0%, rgba(32, 201, 151, 0.2) 100%)",
              border: "1px solid rgba(40, 167, 69, 0.3)",
            }}
          >
            <div className="card-body p-4 text-center">
              <h3 className="fw-bold mb-3"><span style={{ color: "white" }}>{prediction}</span></h3>
              <div className="d-flex justify-content-center align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <FiTrendingUp className="text-success" size={24} />
                  <span className="fs-4 fw-bold" style={{ color: "white" }}>{confidencePercentage}%</span>
                  <span className="text-muted"><span style={{ color: "white" }}>confidence</span></span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Info Section */}
          {info && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="row g-4 mb-4"
            >
              <div className="col-md-6">
                <div className="card border-0 shadow h-100" style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}>
                  <div className="card-body p-4">
                    <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                      <FiMapPin className="text-info" />
                      About {prediction}
                    </h5>
                    <p className="card-text text-light mb-3">{info.description}</p>
                    <p className="mb-2">
                      <strong className="text-warning">Origin:</strong>{" "}
                      <span className="text-light">{info.origin}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card border-0 shadow h-100" style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  backdropFilter: "blur(10px)",
                }}>
                  <div className="card-body p-4">
                    <h5 className="card-title mb-3 d-flex align-items-center gap-2">
                      <FiTag className="text-warning" />
                      Flavor Notes
                    </h5>
                    <div className="d-flex flex-wrap gap-2">
                      {info.flavorNotes?.map((note: string, index: number) => (
                        <span
                          key={index}
                          className="badge rounded-pill px-3 py-2"
                          style={{
                            background: "rgba(255, 193, 7, 0.2)",
                            color: "#ffc107",
                            border: "1px solid rgba(255, 193, 7, 0.3)",
                            fontSize: "0.9rem",
                          }}
                        >
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Charts */}
          {chartData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="row g-4 mb-4"
            >
              <div className="col-md-8">
                <div
                  className="card border-0 shadow h-100"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div className="card-body p-4">
                    <div style={{ height: "350px" }}>
                      <Bar data={chartData} options={chartOptions} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                {doughnutData && (
                  <div
                    className="card border-0 shadow h-100"
                    style={{
                      background: "rgba(255, 255, 255, 0.1)",
                      backdropFilter: "blur(10px)",
                    }}
                  >
                    <div className="card-body p-4">
                      <div style={{ height: "350px" }}>
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <button
              className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg me-3"
              onClick={() =>
                navigate("/dashboard", {
                  state: { croppedImage, prediction, confidence, probabilities, info },
                })
              }
            >
              <FiArrowLeft className="me-2" />
              Back to Dashboard
            </button>
            <button
              className="btn btn-success btn-lg rounded-pill px-5 shadow-lg"
              onClick={() => navigate("/dashboard")}
            >
              New Prediction
            </button>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default Results;
