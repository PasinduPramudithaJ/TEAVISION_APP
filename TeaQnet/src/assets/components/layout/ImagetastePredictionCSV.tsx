import React, { useState, useRef,useEffect} from "react";
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
  FiActivity
} from "react-icons/fi";

interface RGBRow {
  Filename: string;
  R_Mean: number;
  G_Mean: number;
  B_Mean: number;
  Taste?: number;
  Intensity?: number;
  Mouthfeel?: number;
  error?: string;
}

const RGBPredictionFromCSV: React.FC = () => {
  const [rows, setRows] = useState<RGBRow[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      const savedUrl = localStorage.getItem("backend_url");
      if (savedUrl) setApiUrl(savedUrl);
    }, []);

  // ================= CSV PARSER =================
  const parseCSV = async (file: File): Promise<RGBRow[]> => {
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim() !== "");

    const headers = lines[0]
      .split(",")
      .map(h => h.replace(/"/g, "").trim());

    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.replace(/"/g, "").trim());
      const row: any = {};
      headers.forEach((h, i) => (row[h] = values[i]));

      const r = parseFloat(row.R_Mean ?? row["R Mean"]);
      const g = parseFloat(row.G_Mean ?? row["G Mean"]);
      const b = parseFloat(row.B_Mean ?? row["B Mean"]);

      return {
        Filename: row.Filename || "",
        R_Mean: r,
        G_Mean: g,
        B_Mean: b,
        error: isNaN(r) || isNaN(g) || isNaN(b) ? "Invalid RGB values" : undefined,
      };
    });
  };

  // ================= UPLOAD =================
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

  // ================= PREDICT =================
  const handlePredictAll = async () => {
    if (rows.length === 0) return alert("Upload CSV first!");
    setIsPredicting(true);

    try {
      const updated = await Promise.all(
        rows.map(async row => {
          if (row.error) return row;

          try {
            const res = await fetch(`${apiUrl}/predict_RGB`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                R_Mean: row.R_Mean,
                G_Mean: row.G_Mean,
                B_Mean: row.B_Mean,
              }),
            });

            const data = await res.json();
            if (!res.ok || data.status === "failed") {
              throw new Error(data.error || "Prediction failed");
            }

            return {
              ...row,
              Taste: data.Taste,
              Intensity: data.Intensity,
              Mouthfeel: data.Mouthfeel,
            };
          } catch (err: any) {
            return { ...row, error: err.message };
          }
        })
      );

      setRows(updated);
    } finally {
      setIsPredicting(false);
    }
  };

  // ================= DOWNLOAD =================
  const downloadCSV = () => {
    const headers = [
      "Filename",
      "R_Mean",
      "G_Mean",
      "B_Mean",
      "Taste",
      "Intensity",
      "Mouthfeel",
    ];

    const data = rows.map(r => [
      r.Filename,
      r.R_Mean.toFixed(2),
      r.G_Mean.toFixed(2),
      r.B_Mean.toFixed(2),
      r.Taste ?? "",
      r.Intensity ?? "",
      r.Mouthfeel ?? "",
    ]);

    const csv = [headers, ...data].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rgb_predictions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // ================= CLEAR =================
  const handleClear = () => {
    setRows([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ================= DRAG & DROP =================
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (!file || !file.name.endsWith(".csv")) return alert("Please drop a CSV file!");
    handleCSVUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
          📈 RGB → Taste Prediction (CSV)
        </motion.h2>

        {/* Drag & Drop Upload */}
        <div
          className="card shadow-lg mb-4 p-4"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          style={{ cursor: "pointer" }}
        >
          <p className="mb-2">Drag & Drop or Upload CSV</p>
          <input
            type="file"
            accept=".csv"
            className="d-none"
            id="csv-upload"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <label htmlFor="csv-upload" className="btn btn-outline-primary btn-lg rounded-pill">
            <FiUpload className="me-2" /> Upload CSV
          </label>
        </div>

        {/* Actions */}
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
              <div
                className="table-responsive"
                style={{ maxHeight: "500px", overflowY: "auto" }}
              >
                <table className="table table-hover align-middle mb-0">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      backgroundColor: "white",
                      zIndex: 10,
                    }}
                  >
                    <tr>
                      <th>#</th>
                      <th>Filename</th>
                      <th>R</th>
                      <th>G</th>
                      <th>B</th>
                      <th>Taste</th>
                      <th>Intensity</th>
                      <th>Mouthfeel</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{r.Filename}</td>
                        <td>{r.R_Mean.toFixed(2)}</td>
                        <td>{r.G_Mean.toFixed(2)}</td>
                        <td>{r.B_Mean.toFixed(2)}</td>
                        <td>{r.Taste ?? "-"}</td>
                        <td>{r.Intensity ?? "-"}</td>
                        <td>{r.Mouthfeel ?? "-"}</td>
                        <td>
                          {r.error ? (
                            <span className="badge bg-danger">
                              <FiX /> Error
                            </span>
                          ) : r.Taste !== undefined ? (
                            <span className="badge bg-success">
                              <FiCheckCircle /> Done
                            </span>
                          ) : (
                            "Pending"
                          )}
                        </td>
                      </tr>
                    ))}
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
          <button className="btn btn-outline-light" onClick={() => navigate('/rgb-analysis')}>
            <FiActivity /> RGB Analysis
          </button>
          <button className="btn btn-dark" onClick={() => navigate("/")}>
            <FiHome /> Home
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default RGBPredictionFromCSV;
