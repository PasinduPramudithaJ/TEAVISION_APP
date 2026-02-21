import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { useNavigate } from "react-router-dom";
import { 
  FiUpload, FiDownload, FiArrowLeft, FiHome, FiX, FiCheckCircle, 
  FiActivity
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

const regionMapping: { [key: string]: string } = {
  "DI": "Dimbula Region",
  "UV": "Uva Region",
  "KA": "Kandy Region",
  "NU": "Nuwara Eliya Region",
  "SB": "Sabaragamuwa Region",
  "UP": "Udapussellawa Region",
  "RU": "Ruhuna Region"
};

const regionMap: { [key: number]: string } = {
  0: "Dimbula Region", 1: "Kandy Region", 2: "Nuwara Eliya Region", 3: "Ruhuna Region",
  4: "Sabaragamuwa Region", 5: "Udapussellawa Region", 6: "Uva Region"
};
const groupMap: { [key: number]: string } = { 0: "BOP", 1: "BOPF", 2: "OP" };

const CombinedFeatureRegion: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [outputCsvName, /*setOutputCsvName*/] = useState("handcrafted_features.csv");
  const [isExtracting, setIsExtracting] = useState(false);
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [, setIsPredicting] = useState(false);
  const [apiUrl, setApiUrl] = useState(`http://${window.location.hostname}:5000`);
  const [selectedModel] = useState<string>("randomforest");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const featureColumns = [
    "R_mean","G_mean","B_mean","H_mean","S_mean","V_mean",
    "Texture_mean","Texture_std","Texture_skew","Texture_kurtosis",
    "Edge_mean",
    ...Array.from({ length: 256 }, (_, i) => `LBP_${i}`)
  ];

  useEffect(() => {
    const savedUrl = localStorage.getItem("backend_url");
    if (savedUrl) setApiUrl(savedUrl);
  }, []);

  // ------------------- Helpers -------------------
  const getRegionName = (filename: string) => {
    const lower = filename.toLowerCase();
    for (const key in regionMapping) {
      if (lower.includes(key.toLowerCase())) return regionMapping[key];
    }
    return "Unknown Region";
  };

  const parseCSVText = async (text: string): Promise<PredictionRow[]> => {
    const lines = text.split("\n").filter(l => l.trim() !== "");
    if (!lines.length) return [];
    const headers = lines[0].split(",").map(h => h.trim());
    const parsed: PredictionRow[] = lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim());
      const row: any = {};
      headers.forEach((h,i)=>row[h]=values[i]);
      return {
        ...row,
        R_mean: parseFloat(row.R_mean)||0,
        G_mean: parseFloat(row.G_mean)||0,
        B_mean: parseFloat(row.B_mean)||0,
        H_mean: parseFloat(row.H_mean)||0,
        S_mean: parseFloat(row.S_mean)||0,
        V_mean: parseFloat(row.V_mean)||0,
        error: undefined
      };
    });
    return parsed;
  };

  // ------------------- Feature Extraction -------------------
  const handleExtractFeatures = async () => {
    if (!files.length) return alert("Please select dataset images!");
    if (!outputCsvName) return alert("Provide CSV file name!");

    setIsExtracting(true);
    try {
      const formData = new FormData();
      files.forEach(f => {
        const region = getRegionName(f.name);
        formData.append("images", f);
        formData.append("regions", region);
      });
      //formData.append("output_csv", outputCsvName);

      const res = await fetch(`${apiUrl}/extract_features`, { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Feature extraction failed");
      }

      const blob = await res.blob();

      // Parse CSV in memory automatically for prediction
      const text = await blob.text();
      const parsedRows = await parseCSVText(text);
      setRows(parsedRows);

      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-predict immediately after extraction
      await handlePredictAll(parsedRows);

      //alert("✔ Features extracted and prediction completed!");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (selected) setFiles(Array.from(selected));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/"));
    if (!droppedFiles.length) return alert("Please drop image files!");
    setFiles(droppedFiles);
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };

  // ------------------- Prediction -------------------
  const handlePredictAll = async (rowsToPredict?: PredictionRow[]) => {
    const targetRows = rowsToPredict || rows;
    if (!targetRows.length) return;

    setIsPredicting(true);
    try {
      const rowsWithAllFeatures = targetRows.map(row => {
        const newRow = {...row};
        featureColumns.forEach(col => { if(!(col in newRow)) newRow[col]=0; });
        return newRow;
      });

      const res = await fetch(`${apiUrl}/predict_region_group`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Model-Name": selectedModel },
        body: JSON.stringify({ rows: rowsWithAllFeatures, feature_columns: featureColumns })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Prediction failed");
      setRows(data.results);
    } catch (err: any) {
      alert(err.message);
    } finally { setIsPredicting(false); }
  };

  const downloadCSV = () => {
    if (!rows.length) return;
    const headers = ["Label","R_mean","G_mean","B_mean","H_mean","S_mean","V_mean","region","group","predicted_region","predicted_group","status"];
    const csvData = rows.map(r => [
      r.path,
      r.R_mean,r.G_mean,r.B_mean,r.H_mean,r.S_mean,r.V_mean,
      r.region??"", r.group??"",
      r.predicted_region!==undefined?regionMap[Number(r.predicted_region)]:"",
      r.predicted_group!==undefined?groupMap[Number(r.predicted_group)]:"",
      r.predicted_region!==undefined?"Done":"Pending"
    ]);
    const csv = [headers, ...csvData].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `region_group_predictions_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const handleClear = () => { setRows([]); setFiles([]); if(fileInputRef.current) fileInputRef.current.value=""; };

  // ------------------- Accuracy -------------------
  const totalPredicted = rows.filter(r => r.predicted_region!==undefined && r.predicted_group!==undefined).length;
  const totalCorrect = rows.filter(r => (r.region===regionMap[Number(r.predicted_region)] && r.group===groupMap[Number(r.predicted_group)])).length;
  const accuracy = totalPredicted>0 ? ((totalCorrect/totalPredicted)*100).toFixed(1) : "0";
  const radius = 70; const circumference = 2*Math.PI*radius;

  return (
    <>
      <Header />
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{ backgroundImage:`linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`, backgroundSize:"cover", minHeight:"85vh", paddingTop:"100px", color:"white" }}>
        
        <motion.h2 className="fw-bold mb-4">🖼️ Feature Extraction + 🌍 Region & Group Prediction</motion.h2>

        {/* --- Feature Extraction Card --- */}
        <div className="card shadow-lg p-4 mb-4 d-flex flex-column align-items-center flex-wrap"
          onDrop={handleDrop} onDragOver={handleDragOver} style={{ maxWidth:"700px", width:"100%", cursor:"pointer" }}>
          <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100">
            <p className="mb-0 fw-semibold">Drag & Drop or Select Images {files.length>0 && <span className="badge bg-info ms-2">{files.length} image{files.length>1?"s":""}</span>}</p>
            <input type="file" multiple accept="image/*" className="d-none" ref={fileInputRef} id="image-upload" onChange={handleFileChange} />
            <label htmlFor="image-upload" className="btn btn-outline-primary btn-lg rounded-pill d-flex align-items-center gap-2"><FiUpload /> Upload Images</label>
          </div>

          <div className="d-flex flex-column flex-md-row align-items-center gap-3 w-100 mt-3">
           {/* ---  <label className="form-label fw-bold mb-0">Output CSV Name:</label>
            <input type="text" className="form-control" placeholder="handcrafted_features.csv" value={outputCsvName} onChange={(e)=>setOutputCsvName(e.target.value)} />--- */}
          </div>

          <div className="d-flex gap-2 mt-3 flex-wrap">
            <button className="btn btn-success rounded-pill d-flex align-items-center gap-2" disabled={!files.length||!outputCsvName||isExtracting} onClick={handleExtractFeatures}>
              <FiActivity /> {isExtracting?"Extracting...":"Extract Features & Predict"}
            </button>
            {files.length>0 && <button className="btn btn-danger rounded-pill d-flex align-items-center gap-2" onClick={()=>setFiles([])}><FiX /> Cancel</button>}
          </div>
        </div>

        {/* --- Accuracy Circle --- */}
        {rows.length>0 && totalPredicted>0 && (
          <div className="mb-4 text-center">
            <h5 className="fw-bold mb-3">Prediction Accuracy</h5>
            <div style={{width:180,height:180,position:"relative"}}>
              <svg width="180" height="180">
                <circle cx="90" cy="90" r={radius} stroke="#e6e6e6" strokeWidth="15" fill="none"/>
                <motion.circle
                  cx="90" cy="90" r={radius} stroke={Number(accuracy)>=80?"#28a745":Number(accuracy)>=60?"#ffc107":"#dc3545"}
                  strokeWidth="15" fill="none" strokeDasharray={circumference}
                  initial={{ strokeDashoffset:circumference }}
                  animate={{ strokeDashoffset: circumference-(Number(accuracy)/100)*circumference }}
                  transition={{ duration: 1.5 }}
                  strokeLinecap="round"
                />
              </svg>
              <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:"26px",fontWeight:"bold"}}>
                {accuracy}%
              </div>
            </div>
          </div>
        )}

        {/* --- Table of Predictions --- */}
        {rows.length>0 && (
          <div className="container mb-4">
            <div className="card shadow-lg">
              <div className="table-responsive" style={{ maxHeight:"500px", overflowY:"auto" }}>
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ position:"sticky", top:0, backgroundColor:"white" }}>
                    <tr>
                      <th>#</th>
                      <th>Label</th>
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
                    {rows.map((r,i)=>{
                      const highlight = r.predicted_region!==undefined && r.predicted_group!==undefined &&
                        (r.region!==regionMap[Number(r.predicted_region)] || r.group!==groupMap[Number(r.predicted_group)]);
                      return (
                        <tr key={i}>
                          <td>{i+1}</td>
                          <td style={{maxWidth:"200px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={r.path}>{r.path}</td>
                          <td>{r.R_mean?.toFixed(2)}</td>
                          <td>{r.G_mean?.toFixed(2)}</td>
                          <td>{r.B_mean?.toFixed(2)}</td>
                          <td>{r.H_mean?.toFixed(2)}</td>
                          <td>{r.S_mean?.toFixed(2)}</td>
                          <td>{r.V_mean?.toFixed(2)}</td>
                          <td style={{backgroundColor:highlight?"#ffd6d6":"transparent"}}>{r.region??"-"}</td>
                          <td style={{backgroundColor:highlight?"#ffd6d6":"transparent"}}>{r.group??"-"}</td>
                          <td style={{backgroundColor:highlight?"#ffd6d6":"transparent",color:"blue"}}>{r.predicted_region!==undefined?regionMap[Number(r.predicted_region)]:"-"}</td>
                          <td style={{backgroundColor:highlight?"#ffd6d6":"transparent",color:"green"}}>{r.predicted_group!==undefined?groupMap[Number(r.predicted_group)]:"-"}</td>
                          <td>{r.predicted_region!==undefined?<span className="badge bg-success"><FiCheckCircle /> Done</span>:<span className="badge bg-warning">Pending</span>}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* --- Action Buttons --- */}
        {rows.length>0 && (
          <div className="d-flex gap-3 mb-4">
            <button className="btn btn-primary rounded-pill" onClick={downloadCSV}><FiDownload className="me-2"/>Download CSV</button>
            <button className="btn btn-outline-danger rounded-pill" onClick={handleClear}><FiX className="me-2"/>Clear</button>
          </div>
        )}

        {/* --- Navigation --- */}
        <div className="mt-5 d-flex gap-3">
          <button className="btn btn-outline-light" onClick={()=>navigate(-1)}><FiArrowLeft /> Back</button>
          <button className="btn btn-outline-light" onClick={()=>navigate("/")}> <FiHome /> Home </button>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CombinedFeatureRegion;