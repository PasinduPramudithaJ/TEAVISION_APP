import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FiUpload, FiZap, FiTrash2, FiFileText, FiFile, FiArrowLeft, FiHome, FiPlus, FiCheckCircle, FiX } from "react-icons/fi";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter, ResponsiveContainer
} from "recharts";

interface PolyResult {
  prediction?: string;
  confidence?: number;
  error?: string;
}

interface PolyRow {
  Region?: string;
  Grade?: string;
  Sample?: string;
  Absorbance: number;
  Concentration: number;
}

const regions = ["Region", "Dimbula Region", "Ruhuna Region", "Sabaragamuwa Region"];
const grades = ["Grade", "BOP", "BOPF", "OP", "DUST"];
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#AA336A"];

const PolyphenolPredict: React.FC = () => {
  const [data, setData] = useState<PolyRow[]>([]);
  const [results, setResults] = useState<PolyResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [apiUrls] = useState<string[]>([
    `http://${window.location.hostname}:5000`,
    `https://polyphenol-based-region-classification.onrender.com`
  ]);
  const [activeApiUrl, setActiveApiUrl] = useState(apiUrls[0]);

  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setData([]);
    setResults([]);
    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      if (!csv) return;
      const lines = csv.trim().split(/\r?\n/);
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const regionIdx = header.findIndex((h) => h === "region");
      const gradeIdx = header.findIndex((h) => h === "grade");
      const sampleIdx = header.findIndex((h) => h === "sample");
      const absorbanceIdx = header.findIndex((h) => h.includes("absorbance"));
      const concentrationIdx = header.findIndex((h) => h.includes("concentration"));

      const parsed = lines.slice(1)
        .map((line) => line.split(",").map((v) => v.trim()))
        .filter((cols) => cols.length > Math.max(absorbanceIdx, concentrationIdx))
        .map((cols) => ({
          Region: regionIdx !== -1 ? cols[regionIdx] : "",
          Grade: gradeIdx !== -1 ? cols[gradeIdx] : "",
          Sample: sampleIdx !== -1 ? cols[sampleIdx] : "",
          Absorbance: parseFloat(cols[absorbanceIdx]),
          Concentration: parseFloat(cols[concentrationIdx]),
        }))
        .filter((obj) => !isNaN(obj.Absorbance) && !isNaN(obj.Concentration));
      setData(parsed);
      setResults(Array(parsed.length).fill({}));
    };
    reader.readAsText(file);
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
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target?.result as string;
          if (!csv) return;
          const lines = csv.trim().split(/\r?\n/);
          const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
          const regionIdx = header.findIndex((h) => h === "region");
          const gradeIdx = header.findIndex((h) => h === "grade");
          const sampleIdx = header.findIndex((h) => h === "sample");
          const absorbanceIdx = header.findIndex((h) => h.includes("absorbance"));
          const concentrationIdx = header.findIndex((h) => h.includes("concentration"));

          const parsed = lines.slice(1)
            .map((line) => line.split(",").map((v) => v.trim()))
            .filter((cols) => cols.length > Math.max(absorbanceIdx, concentrationIdx))
            .map((cols) => ({
              Region: regionIdx !== -1 ? cols[regionIdx] : "",
              Grade: gradeIdx !== -1 ? cols[gradeIdx] : "",
              Sample: sampleIdx !== -1 ? cols[sampleIdx] : "",
              Absorbance: parseFloat(cols[absorbanceIdx]),
              Concentration: parseFloat(cols[concentrationIdx]),
            }))
            .filter((obj) => !isNaN(obj.Absorbance) && !isNaN(obj.Concentration));
          setData(parsed);
          setResults(Array(parsed.length).fill({}));
        };
        reader.readAsText(file);
      }
    }
  };

  const handleManualAdd = (region: string, grade: string, Absorbance: number, Concentration: number) => {
    setData((prev) => [...prev, { Region: region, Grade: grade, Sample: `Sample-${prev.length + 1}`, Absorbance, Concentration }]);
    setResults((prev) => [...prev, {}]);
  };

  const handleClear = () => {
    setData([]);
    setResults([]);
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

  const smartFetch = async (endpoint: string, body: any) => {
    let response: Response | null = null;
    const userEmail = getUserEmail();
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (userEmail) {
      headers["X-User-Email"] = userEmail;
    }
    for (const url of apiUrls) {
      try {
        const res = await fetch(`${url}${endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setActiveApiUrl(url);
          response = res;
          break;
        }
      } catch {
        console.warn(`⚠️ Backend failed: ${url}`);
      }
    }
    return response;
  };

  const handlePredictAll = async () => {
    if (data.length === 0) {
      alert("No data to predict!");
      return;
    }
    setIsLoading(true);
    try {
      const payload = { data: data.map((row) => ({ Absorbance: row.Absorbance, Concentration: row.Concentration })) };
      const response = await smartFetch("/predict_polyphenol_region", payload);
      if (!response) throw new Error("All backends offline");
      const resData: any = await safeJsonParse(response);
      if (resData.error) {
        alert(`❌ Prediction failed: ${resData.error}`);
        return;
      }
      setResults(resData);
    } catch (error: any) {
      alert(`❌ Prediction failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePredictSingle = async (i: number, row: PolyRow) => {
    try {
      const payload = { data: [{ Absorbance: row.Absorbance, Concentration: row.Concentration }] };
      const response = await smartFetch("/predict_polyphenol_region", payload);
      if (!response) throw new Error("All backends failed");
      const resData: any = await safeJsonParse(response);
      if (resData.error) {
        alert(`Prediction failed: ${resData.error}`);
        return;
      }
      if (!resData || resData.length === 0) {
        alert("No prediction result received");
        return;
      }
      setResults((prev) => {
        const newResults = [...prev];
        newResults[i] = resData[0];
        return newResults;
      });
    } catch (error: any) {
      alert(`Prediction failed: ${error.message || "Unknown error"}`);
    }
  };

  const handleDownloadCSV = () => {
    if (results.length === 0) return;
    const header = ["Region", "Grade", "Sample", "Absorbance", "Concentration", "Prediction", "Confidence", "Result"];
    const rows = data.map((row, i) => {
      const res = results[i] || {};
      const isCorrect = row.Region === res.prediction;
      return [
        row.Region || "—",
        row.Grade || "—",
        row.Sample || `Sample-${i + 1}`,
        row.Absorbance,
        row.Concentration,
        res.prediction || "—",
        res.confidence ? (res.confidence * 100).toFixed(2) + "%" : "—",
        res.prediction ? (isCorrect ? "Correct" : "Failed") : "—",
      ];
    });
    const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "polyphenol_predictions.csv";
    link.click();
  };

  const handleDownloadPDF = async () => {
    if (!tableRef.current) return;
    const canvas = await html2canvas(tableRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const width = pdf.internal.pageSize.getWidth();
    const height = (canvas.height * width) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, width, height);
    pdf.save("polyphenol_predictions.pdf");
  };

  const barData = regions.slice(1).map((r) => {
    const filtered = data.filter((d) => d.Region === r);
    return {
      Region: r.length > 15 ? r.substring(0, 15) + "..." : r,
      Absorbance: filtered.reduce((a, c) => a + c.Absorbance, 0) / (filtered.length || 1),
      Concentration: filtered.reduce((a, c) => a + c.Concentration, 0) / (filtered.length || 1),
    };
  });

  const gradeCounts = grades.slice(1).map((g) => ({
    Grade: g,
    count: data.filter((d) => d.Grade === g).length,
  }));

  const correctCount = data.filter((row, i) => {
    const res = results[i] || {};
    return row.Region === res.prediction;
  }).length;

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center text-center py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "white",
          minHeight: "85vh",
          paddingTop: "100px"
        }}
      >
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 fw-bold"
          style={{ marginTop: "100px", fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.5)" }}
        >
          ☕ Polyphenol-based Region Classification
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <span className="badge bg-success rounded-pill px-3 py-2">
            Active Backend: {activeApiUrl}
          </span>
        </motion.div>

        {/* Stats Cards */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="container mb-4"
            style={{ maxWidth: "1000px" }}
          >
            <div className="row g-3">
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-primary mb-0">{data.length}</h3>
                    <small className="text-muted">Total Samples</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-info mb-0">{results.filter(r => r.prediction).length}</h3>
                    <small className="text-muted">Predicted</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-lg" style={{ borderRadius: "15px", background: "rgba(255, 255, 255, 0.95)" }}>
                  <div className="card-body text-center p-3">
                    <h3 className="fw-bold text-success mb-0">{correctCount}</h3>
                    <small className="text-muted">Correct</small>
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
          transition={{ delay: 0.4 }}
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
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FiUpload className="text-primary" />
              Upload Polyphenol Data (CSV)
            </h5>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-3 border-dashed rounded-4 p-4 text-center mb-4 ${
                dragActive ? "border-success bg-light" : "border-secondary"
              }`}
              style={{
                transition: "all 0.3s ease",
                cursor: "pointer",
                background: dragActive ? "rgba(40, 167, 69, 0.1)" : "transparent",
              }}
              onClick={() => document.getElementById("csv-input")?.click()}
            >
              <FiUpload className="display-5 text-muted mb-2" />
              <p className="text-muted mb-2 fw-bold">
                {dragActive ? "Drop your CSV file here" : "Drag & drop or click to upload CSV file"}
              </p>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="d-none"
              />
            </div>

            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <FiPlus className="text-success" />
              Or Add Sample Manually
            </h5>
            <ManualAddForm onAdd={handleManualAdd} />

            <div className="mt-4 d-flex justify-content-center flex-wrap gap-2">
              <motion.button
                className="btn btn-info btn-lg rounded-pill shadow-lg d-flex align-items-center gap-2 px-4"
                onClick={handlePredictAll}
                disabled={isLoading || data.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isLoading ? (
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
                disabled={data.length === 0}
              >
                <FiTrash2 /> Clear All
              </button>
              {results.length > 0 && (
                <>
                  <button
                    className="btn btn-success btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                    onClick={handleDownloadCSV}
                  >
                    <FiFile /> Export CSV
                  </button>
                  <button
                    className="btn btn-secondary btn-lg rounded-pill shadow d-flex align-items-center gap-2 px-4"
                    onClick={handleDownloadPDF}
                  >
                    <FiFileText /> Export PDF
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Visualizations */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="container mb-5"
            style={{ maxWidth: "1200px" }}
          >
            <div className="card border-0 shadow-lg p-4" style={{ borderRadius: "25px", background: "rgba(255, 255, 255, 0.95)" }}>
              <h4 className="fw-bold text-center mb-4 text-dark">📊 Polyphenol Data Visualizations</h4>
              <div className="row g-4">
                <div className="col-md-4">
                  <h6 className="fw-bold text-center mb-3">📊 Avg Absorbance & Concentration</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="Region" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Absorbance" fill="#8884d8" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="Concentration" fill="#82ca9d" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-md-4">
                  <h6 className="fw-bold text-center mb-3">🥧 Sample Distribution by Grade</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={gradeCounts} dataKey="count" nameKey="Grade" cx="50%" cy="50%" outerRadius={100} label>
                        {gradeCounts.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="col-md-4">
                  <h6 className="fw-bold text-center mb-3">⚡ Absorbance vs Concentration</h6>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="Absorbance" />
                      <YAxis type="number" dataKey="Concentration" />
                      <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                      <Scatter name="Samples" data={data} fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Results Table */}
        {data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="container mt-4"
            style={{ maxWidth: "1200px" }}
          >
            <div
              ref={tableRef}
              className="card border-0 shadow-lg"
              style={{
                borderRadius: "20px",
                background: "rgba(255, 255, 255, 0.95)",
                maxHeight: "600px",
                overflowY: "auto",
              }}
            >
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 text-dark">📋 Prediction Results</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>#</th>
                        <th>Region</th>
                        <th>Grade</th>
                        <th>Absorbance</th>
                        <th>Concentration</th>
                        <th>Prediction</th>
                        <th>Result</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, i) => {
                        const res = results[i] || {};
                        const isCorrect = row.Region === res.prediction;
                        return (
                          <motion.tr
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.7 + i * 0.05 }}
                          >
                            <td className="fw-bold">{i + 1}</td>
                            <td>{row.Region || "—"}</td>
                            <td>
                              <span className="badge bg-secondary rounded-pill">{row.Grade || "—"}</span>
                            </td>
                            <td className="fw-bold">{row.Absorbance.toFixed(3)}</td>
                            <td className="fw-bold">{row.Concentration.toFixed(3)}</td>
                            <td>
                              {res.prediction ? (
                                <span className="badge bg-success rounded-pill">{res.prediction}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              {res.prediction ? (
                                isCorrect ? (
                                  <span className="badge bg-success rounded-pill">
                                    <FiCheckCircle className="me-1" />
                                    Correct
                                  </span>
                                ) : (
                                  <span className="badge bg-danger rounded-pill">
                                    <FiX className="me-1" />
                                    Failed
                                  </span>
                                )
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>
                              <button
                                className="btn btn-sm btn-info rounded-pill"
                                onClick={() => handlePredictSingle(i, row)}
                              >
                                <FiZap className="me-1" />
                                Predict
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
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
          transition={{ delay: 0.8 }}
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

const ManualAddForm: React.FC<{ onAdd: (region: string, grade: string, Abs: number, Conc: number) => void }> = ({ onAdd }) => {
  const [abs, setAbs] = useState("");
  const [conc, setConc] = useState("");
  const [region, setRegion] = useState(regions[0]);
  const [grade, setGrade] = useState(grades[0]);

  return (
    <div className="card border-0 shadow-sm p-3 mb-3" style={{ borderRadius: "15px", background: "rgba(0,0,0,0.05)" }}>
      <div className="row g-2 align-items-end">
        <div className="col-md-3">
          <label className="form-label small fw-bold">Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="form-select form-select-sm rounded-pill"
          >
            {regions.map((r, idx) => (
              <option key={idx} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <label className="form-label small fw-bold">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="form-select form-select-sm rounded-pill"
          >
            {grades.map((g, idx) => (
              <option key={idx} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-bold">Absorbance</label>
          <input
            type="number"
            step="0.001"
            placeholder="0.000"
            value={abs}
            onChange={(e) => setAbs(e.target.value)}
            className="form-control form-control-sm rounded-pill"
          />
        </div>
        <div className="col-md-3">
          <label className="form-label small fw-bold">Concentration</label>
          <input
            type="number"
            step="0.001"
            placeholder="0.000"
            value={conc}
            onChange={(e) => setConc(e.target.value)}
            className="form-control form-control-sm rounded-pill"
          />
        </div>
        <div className="col-md-1">
          <button
            className="btn btn-success btn-sm rounded-pill w-100"
            onClick={() => {
              if (abs && conc) {
                onAdd(region, grade, parseFloat(abs), parseFloat(conc));
                setAbs("");
                setConc("");
              }
            }}
          >
            <FiPlus />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolyphenolPredict;
