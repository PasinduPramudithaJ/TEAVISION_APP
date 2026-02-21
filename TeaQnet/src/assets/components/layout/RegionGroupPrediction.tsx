import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import {
  FiUpload,
  FiDownload,
  FiArrowLeft,
  FiHome,
  FiBarChart2,
  FiCheckCircle,
  FiX,
  FiActivity,
} from "react-icons/fi";

interface PredictionRow {
  R_mean: number;
  G_mean: number;
  B_mean: number;
  H_mean: number;
  S_mean: number;
  V_mean: number;
  region?: string;
  group?: string;
  predicted_region?: string;
  predicted_group?: string;
  error?: string;
  [key: string]: any;
}

const RegionGroupPrediction: React.FC = () => {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(
    `http://${window.location.hostname}:5000`
  );
  const [selectedModel, setSelectedModel] = useState<string>("svm"); // <-- selected model

  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const featureColumns = [
    "R_mean", "G_mean", "B_mean", "H_mean", "S_mean", "V_mean",
    "Texture_mean","Texture_std","Texture_skew","Texture_kurtosis",
    "Edge_mean",
    ...Array.from({ length: 256 }, (_, i) => `LBP_${i}`)
  ];

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // CSV parser
  const parseCSV = async (file: File): Promise<PredictionRow[]> => {
    const text = await file.text();
    const lines = text.split("\n").filter((l) => l.trim() !== "");
    const headers = lines[0].split(",").map((h) => h.trim());

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const row: any = {};
      headers.forEach((h, i) => (row[h] = values[i]));

      return {
        ...row,
        R_mean: parseFloat(row.R_mean) || 0,
        G_mean: parseFloat(row.G_mean) || 0,
        B_mean: parseFloat(row.B_mean) || 0,
        H_mean: parseFloat(row.H_mean) || 0,
        S_mean: parseFloat(row.S_mean) || 0,
        V_mean: parseFloat(row.V_mean) || 0,
        error: undefined,
      };
    });
  };

  const handleCSVUpload = async (file: File) => {
    const parsed = await parseCSV(file);
    setRows(parsed);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    handleCSVUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Predict
  const handlePredictAll = async () => {
    if (rows.length === 0) {
      alert("Upload CSV first!");
      return;
    }
    setIsPredicting(true);
    try {
      const rowsWithAllFeatures = rows.map((row) => {
        const newRow = { ...row };
        featureColumns.forEach((col) => {
          if (!(col in newRow)) newRow[col] = 0;
        });
        return newRow;
      });

      const res = await fetch(`${apiUrl}/predict_region_group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Model-Name": selectedModel // <-- send model to backend
        },
        body: JSON.stringify({ rows: rowsWithAllFeatures, feature_columns: featureColumns }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");

      setRows(data.results);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsPredicting(false);
    }
  };

  // Download CSV
  const downloadCSV = () => {
    const headers = [
      "R_mean","G_mean","B_mean","H_mean","S_mean","V_mean",
      "region","group",
      "predicted_region","predicted_group","status"
    ];

    const csvData = rows.map((r) => [
      r.R_mean,
      r.G_mean,
      r.B_mean,
      r.H_mean,
      r.S_mean,
      r.V_mean,
      r.region ?? "",
      r.group ?? "",
      r.predicted_region !== undefined ? regionMap[Number(r.predicted_region)] : "",
      r.predicted_group !== undefined ? groupMap[Number(r.predicted_group)] : "",
      regionMap[Number(r.predicted_region)] !== undefined ? "Done" : "Pending"
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `region_group_predictions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleClear = () => {
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".csv")) {
      alert("Please drop a CSV file!");
      return;
    }
    handleCSVUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Mapping numbers to names
  const regionMap: { [key: number]: string } = {
    0: "Dimbula Region", 1: "Kandy Region", 2: "Nuwara Eliya Region", 3: "Ruhuna Region",
    4: "Sabaragamuwa Region", 5: "Udapussellawa Region", 6: "Uva Region"
  };

  const groupMap: { [key: number]: string } = {
    0: "BOP", 1: "BOPF", 2: "OP"
  };

  const totalPredicted = rows.filter(
    (r) => r.predicted_region !== undefined && r.predicted_group !== undefined
  ).length;

  const totalCorrect = rows.filter((r) => {
    const correctRegion = r.region === regionMap[Number(r.predicted_region)];
    const correctGroup = r.group === groupMap[Number(r.predicted_group)];
    return correctRegion && correctGroup;
  }).length;

  const accuracy =
    totalPredicted > 0
      ? ((totalCorrect / totalPredicted) * 100).toFixed(1)
      : "0";

  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          minHeight: "85vh",
          paddingTop: "100px",
          color: "white",
        }}
      >
        <motion.h2 className="fw-bold mb-4">
          🌍 Tea Region & Group Prediction (CSV)
        </motion.h2>

        

        {rows.length > 0 && totalPredicted > 0 && (
          <div className="mb-4 text-center">
            <h5 className="fw-bold mb-3">Prediction Accuracy</h5>
            <div style={{ width: 180, height: 180, position: "relative" }}>
              <svg width="180" height="180">
                <circle cx="90" cy="90" r={radius} stroke="#e6e6e6" strokeWidth="15" fill="none"/>
                <motion.circle
                  cx="90"
                  cy="90"
                  r={radius}
                  stroke={
                    Number(accuracy) >= 80
                      ? "#28a745"
                      : Number(accuracy) >= 60
                      ? "#ffc107"
                      : "#dc3545"
                  }
                  strokeWidth="15"
                  fill="none"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{
                    strokeDashoffset:
                      circumference - (Number(accuracy) / 100) * circumference,
                  }}
                  transition={{ duration: 1.5 }}
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "26px",
                  fontWeight: "bold",
                }}
              >
                {accuracy}%
              </div>
            </div>
          </div>
        )}

       {/* Upload & Model Selector on Same Level */}
<div
  className="card shadow-lg mb-4 p-4 d-flex align-items-center justify-content-between flex-wrap"
  onDrop={handleDrop}
  onDragOver={handleDragOver}
  style={{ cursor: "pointer", maxWidth: "700px", width: "100%", margin: "0 auto" }}
>
  {/* CSV Upload */}
  <div className="d-flex align-items-center mb-2 mb-md-0">
    <p className="mb-0 me-3 fw-semibold">Drag & Drop or Upload CSV</p>
    <input
      type="file"
      accept=".csv"
      className="d-none"
      id="csv-upload"
      ref={fileInputRef}
      onChange={handleFileChange}
    />
    <label
      htmlFor="csv-upload"
      className="btn btn-outline-primary btn-lg rounded-pill"
    >
      <FiUpload className="me-2" /> Upload CSV
    </label>
  </div> <br />

  {/* Model Selector */}
  <div className="d-flex align-items-center">
    <label className="form-label fw-bold mb-0 me-2">Select Model:</label>
    <select
      className="form-select w-auto"
      value={selectedModel}
      onChange={(e) => setSelectedModel(e.target.value)}
    >
      <option value="svm">SVM</option>
      <option value="RandomForest">Random Forest</option>
      <option value="KNN">KNN</option>
      <option value="LogisticRegression">Logistic Regression</option>
    </select>
  </div>
</div> <br /><br />

        {/* Action Buttons */}
        {rows.length > 0 && (
          <div className="d-flex gap-3 mb-4">
            <button
              className="btn btn-success rounded-pill"
              onClick={handlePredictAll}
              disabled={isPredicting}
            >
              <FiBarChart2 className="me-2" />
              {isPredicting ? "Predicting..." : "Predict All"}
            </button>
            <button className="btn btn-primary rounded-pill" onClick={downloadCSV}>
              <FiDownload className="me-2" /> Download CSV
            </button>
            <button className="btn btn-outline-danger rounded-pill" onClick={handleClear}>
              <FiX className="me-2" /> Clear
            </button>
          </div>
        )}

        {/* Table */}
        {rows.length > 0 && (
          <div className="container">
            <div className="card shadow-lg">
              <div className="table-responsive" style={{ maxHeight: "1500px", overflowY: "auto" }}>
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ position: "sticky", top: 0, backgroundColor: "white" }}>
                    <tr>
                      <th>#</th>
                      <th>R</th>
                      <th>G</th>
                      <th>B</th>
                      <th>H</th>
                      <th>S</th>
                      <th>V</th>
                      <th>Region</th>
                      <th>Group</th>
                      <th>Pred Region</th>
                      <th>Pred Group</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const highlight = 
                        (r.region !== regionMap[Number(r.predicted_region)] ||
                        r.group !== groupMap[Number(r.predicted_group)]) && r.predicted_region !== undefined && r.predicted_group !== undefined;
                      return (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td>{r.R_mean?.toFixed(2)}</td>
                          <td>{r.G_mean?.toFixed(2)}</td>
                          <td>{r.B_mean?.toFixed(2)}</td>
                          <td>{r.H_mean?.toFixed(2)}</td>
                          <td>{r.S_mean?.toFixed(2)}</td>
                          <td>{r.V_mean?.toFixed(2)}</td>
                          <td style={{ backgroundColor: highlight ? "#ffd6d6" : "transparent" }}>{r.region ?? "-"}</td>
                          <td style={{ backgroundColor: highlight ? "#ffd6d6" : "transparent" }}>{r.group ?? "-"}</td>
                          <td style={{ backgroundColor: highlight ? "#ffd6d6" : "transparent",color: "blue" }}>{regionMap[Number(r.predicted_region)] ?? "-"}</td>
                          <td style={{ backgroundColor: highlight ? "#ffd6d6" : "transparent",color: "green" }}>{groupMap[Number(r.predicted_group)] ?? "-"}</td>
                          <td>
                            {regionMap[Number(r.predicted_region)] !== undefined ? (
                              <span className="badge bg-success">
                                <FiCheckCircle /> Done
                              </span>
                            ) : (
                             <span className="badge bg-warning ">Pending</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-5 d-flex gap-3">
          <button className="btn btn-outline-light" onClick={() => navigate(-1)}>
            <FiArrowLeft /> Back
          </button>
          <button className="btn btn-outline-light" onClick={() => navigate("/")}>
            <FiHome /> Home
          </button>
           <button className="btn btn-outline-light" onClick={() => navigate('/feature_extraction')}>
            <FiActivity /> Feature Extraction
           </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RegionGroupPrediction;