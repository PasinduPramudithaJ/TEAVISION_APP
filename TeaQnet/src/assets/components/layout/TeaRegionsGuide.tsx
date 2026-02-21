import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import sriLankaMapImage from "../../images/srilankamap.jpg";
import {
  FiMapPin,
  FiArrowLeft,
  FiHome,
  FiCamera,
  FiThermometer,
  FiClock,
  FiDroplet,
  FiSun,
  FiInfo,
  FiCheckCircle,
  FiEdit3,
  FiSave,
  FiX,
  FiShield,
} from "react-icons/fi";

interface TeaRegion {
  name: string;
  description: string;
  origin: string;
  flavorNotes: string[];
  altitude: string;
  characteristics: string;
  coordinates: [number, number]; // [x pixel, y pixel] for positioning on image
  color: string;
}

const teaRegions: TeaRegion[] = [
  {
    name: "Nuwara Eliya Region",
    description: "Nuwara Eliya tea is renowned for its light, crisp flavor with delicate floral notes. Grown at high altitudes, this tea offers a bright and citrusy character that is highly sought after.",
    origin: "Central highland, slightly south of Kandy",
    flavorNotes: ["Floral", "Citrus", "Bright"],
    altitude: "1,800 - 2,500 meters",
    characteristics: "Light golden color, delicate body, floral aroma",
    coordinates: [1010, 1150], // Pixel coordinates on map image
    color: "#95E1D3",
  },
  {
    name: "Dimbula Region",
    description: "Dimbula tea is known for its balanced flavor and bright color. Grown in the Central Highlands, this tea offers a refreshing taste with floral and light aromatic notes.",
    origin: "West of Nuwara Eliya – Kegalle / western slope",
    flavorNotes: ["Floral", "Light", "Aromatic"],
    altitude: "1,200 - 1,600 meters",
    characteristics: "Bright golden color, medium body, refreshing taste",
    coordinates: [880, 1080], // Pixel coordinates on map image
    color: "#FF6B6B",
  },
  {
    name: "Udapussellawa Region",
    description: "Udapussellawa tea is known for its mild flavor with a smooth finish. This region produces delicate teas with mild, smooth, and delicate flavor notes, perfect for those who prefer a lighter cup.",
    origin: "East of Nuwara Eliya – Badulla side",
    flavorNotes: ["Mild", "Smooth", "Delicate"],
    altitude: "1,500 - 1,800 meters",
    characteristics: "Light amber color, delicate body, smooth finish",
    coordinates: [1130, 1100], // Pixel coordinates on map image
    color: "#A8E6CF",
  },
  {
    name: "Uva Region",
    description: "Uva tea is famous for its distinctive flavor with a hint of spice. Grown in the Uva Province, this tea offers spicy, fruity, and bold characteristics that make it unique among Ceylon teas.",
    origin: "South-east highlands – Badulla / Monaragala edge",
    flavorNotes: ["Spicy", "Fruity", "Bold"],
    altitude: "900 - 1,500 meters",
    characteristics: "Amber color, medium-full body, spicy notes",
    coordinates: [1220, 1230], // Pixel coordinates on map image
    color: "#FCBAD3",
  },
  {
    name: "Kandy Region",
    description: "Kandy tea is celebrated for its rich aroma and full-bodied flavor. This region produces teas with bold, rich, and aromatic characteristics that are perfect for those who enjoy a strong cup.",
    origin: "Central mid-country",
    flavorNotes: ["Bold", "Rich", "Aromatic"],
    altitude: "600 - 1,200 meters",
    characteristics: "Dark amber color, full body, strong aroma",
    coordinates: [1000, 980], // Pixel coordinates on map image
    color: "#4ECDC4",
  },
  {
    name: "Sabaragamuwa Region",
    description: "Sabaragamuwa tea is distinguished by its strong aroma and dark color. This region produces teas with malty, earthy, and rich flavor notes that appeal to those who prefer a robust cup.",
    origin: "Ratnapura / Kegalle region – south-west interior",
    flavorNotes: ["Malty", "Earthy", "Rich"],
    altitude: "600 - 1,200 meters",
    characteristics: "Dark color, strong body, malty flavor",
    coordinates: [880, 1220], // Pixel coordinates on map image
    color: "#AA96DA",
  },
  {
    name: "Ruhuna Region",
    description: "Ruhuna tea from the Southern lowlands offers a smooth taste with a golden color. This tea is known for its sweet, mellow, and smooth characteristics, making it perfect for everyday consumption.",
    origin: "Southern low country – Galle / Matara belt",
    flavorNotes: ["Sweet", "Mellow", "Smooth"],
    altitude: "Sea level - 600 meters",
    characteristics: "Golden color, smooth texture, sweet aftertaste",
    coordinates: [960, 1450], // Pixel coordinates on map image
    color: "#F38181",
  },
];

const brewingConditions = {
  temperature: "100°C (212°F)",
  time: "6 minutes",
  water: "Fresh, filtered water",
  ratio: "1 teaspoon (2g) per 100ml water",
  tips: [
    "Use freshly boiled water, but let it cool slightly for delicate teas",
    "Pre-warm your teapot or cup",
    "Steep for 6 minutes depending on ISO standards",
    "Remove tea leaves promptly after steeping",
    "Store tea in an airtight container away from light and moisture",
  ],
};

const imageCaptureGuidelines = {
  setup: [
    "Use a controlled lighting environment (natural daylight or soft LED lights)",
    "Place tea sample on a white or neutral background",
    "Ensure consistent camera angle (90° overhead or 45° angle)",
    "Use a high-resolution camera (minimum 2MP, preferably higher)",
    "Maintain consistent distance from the sample (30-50cm recommended)",
  ],
  lighting: [
    "Avoid harsh shadows and direct sunlight",
    "Use diffused lighting for even illumination",
    "Ensure the entire sample is well-lit",
    "Avoid colored lights that may affect color accuracy",
    "Use ISO-calibrated background if available",
  ],
  sample: [
    "Use fresh, dry tea leaves (not brewed)",
    "Spread leaves evenly on the surface",
    "Ensure sample represents the tea region accurately",
    "Remove any foreign objects or debris",
    "Use consistent sample size (approximately 5-10g)",
  ],
  camera: [
    "Set camera to manual mode for consistency",
    "Use fixed white balance (daylight or custom)",
    "Set appropriate ISO (100-400 for good quality)",
    "Use macro mode for close-up shots",
    "Ensure camera is stable (use tripod if possible)",
  ],
  postProcessing: [
    "Avoid heavy editing or filters",
    "Maintain original color accuracy",
    "Crop to focus on the tea sample",
    "Save in high quality (JPEG quality 90+ or PNG)",
    "Ensure image is in focus and sharp",
  ],
};


const TeaRegionsGuide: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<TeaRegion | null>(null);
  const [activeSection, setActiveSection] = useState<"regions" | "brewing" | "capture">("regions");
  const navigate = useNavigate();
  const [imageSize, setImageSize] = useState<{ width: number; height: number; naturalWidth: number; naturalHeight: number } | null>(null);
  
  // Admin functionality
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEditMode, setAdminEditMode] = useState(false);
  const [regionToEdit, setRegionToEdit] = useState<string | null>(null);
  const [regions, setRegions] = useState<TeaRegion[]>(teaRegions);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Check if user is admin and load saved coordinates
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const userIsAdmin = user && (user.is_admin === true || user.email === "pramudithapasindu48@gmail.com");
        setIsAdmin(userIsAdmin);
      } catch (e) {
        setIsAdmin(false);
      }
    }
    
    // Load saved coordinates from localStorage
    const savedCoordinates = localStorage.getItem("teaRegionCoordinates");
    if (savedCoordinates) {
      try {
        const savedRegions = JSON.parse(savedCoordinates);
        setRegions(savedRegions);
      } catch (e) {
        console.error("Failed to load saved coordinates:", e);
      }
    }
  }, []);

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          color: "white",
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
          <h1 className="display-4 fw-bold mb-4" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.5)",marginTop: '100px' }}>
            🫖 Sri Lankan Tea Regions Guide
          </h1>
          <p className="lead mb-5" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
            Discover the seven distinct tea regions of Sri Lanka, their unique characteristics, brewing methods, and image capture guidelines
          </p>

          {/* Navigation Tabs */}
          <div className="d-flex justify-content-center mb-4 flex-wrap gap-2">
            <button
              className={`btn btn-lg rounded-pill px-4 ${activeSection === "regions" ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setActiveSection("regions")}
            >
              <FiMapPin className="me-2" />
              Tea Regions
            </button>
            <button
              className={`btn btn-lg rounded-pill px-4 ${activeSection === "brewing" ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setActiveSection("brewing")}
            >
              <FiThermometer className="me-2" />
              Brewing Guide
            </button>
            <button
              className={`btn btn-lg rounded-pill px-4 ${activeSection === "capture" ? "btn-primary" : "btn-outline-light"}`}
              onClick={() => setActiveSection("capture")}
            >
              <FiCamera className="me-2" />
              Image Capture
            </button>
          </div>

          {/* Tea Regions Section */}
          {activeSection === "regions" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="row g-4"
            >
              {/* Map Section */}
              <div className="col-12 col-lg-6">
                <div
                  className="card shadow-lg border-0 h-100"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                  }}
                >
                  <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h3 className="fw-bold text-dark mb-0">
                        <FiMapPin className="me-2 text-primary" />
                        Sri Lankan Tea Regions Map
                      </h3>
                      {isAdmin && (
                        <div className="d-flex gap-2">
                          {!adminEditMode ? (
                            <button
                              className="btn btn-warning btn-sm rounded-pill d-flex align-items-center gap-2"
                              onClick={() => setAdminEditMode(true)}
                            >
                              <FiEdit3 />
                              Edit Coordinates
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-success btn-sm rounded-pill d-flex align-items-center gap-2"
                                onClick={() => {
                                  // Save coordinates to localStorage or API
                                  localStorage.setItem("teaRegionCoordinates", JSON.stringify(regions));
                                  setHasUnsavedChanges(false);
                                  setAdminEditMode(false);
                                  setRegionToEdit(null);
                                  alert("Coordinates saved successfully!");
                                }}
                                disabled={!hasUnsavedChanges}
                              >
                                <FiSave />
                                Save
                              </button>
                              <button
                                className="btn btn-secondary btn-sm rounded-pill d-flex align-items-center gap-2"
                                onClick={() => {
                                  setRegions(teaRegions); // Reset to original
                                  setHasUnsavedChanges(false);
                                  setAdminEditMode(false);
                                  setRegionToEdit(null);
                                }}
                              >
                                <FiX />
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    {isAdmin && adminEditMode && (
                      <div className="alert alert-info mb-3">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <FiInfo />
                          <strong>Admin Edit Mode:</strong>
                        </div>
                        <div className="mb-2">Select a region below, then click on the map to update its coordinates.</div>
                        <div className="d-flex flex-wrap gap-2">
                          {regions.map((region) => (
                            <button
                              key={region.name}
                              className={`btn btn-sm rounded-pill ${
                                regionToEdit === region.name ? "btn-primary" : "btn-outline-primary"
                              }`}
                              onClick={() => setRegionToEdit(region.name)}
                            >
                              {region.name.split(" ")[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "500px",
                        background: "#f5f5f5",
                        borderRadius: "15px",
                        overflow: "hidden",
                        border: "2px solid #1976d2",
                      }}
                    >
                      {/* Admin Edit Mode Indicator */}
                      {isAdmin && adminEditMode && (
                        <div className="position-absolute top-0 start-50 translate-middle-x mt-3" style={{ zIndex: 1000 }}>
                          <div className="bg-warning bg-opacity-90 px-3 py-2 rounded-pill shadow-lg d-flex align-items-center gap-2">
                            <FiShield className="text-dark" />
                            <span className="text-dark fw-bold">Admin Edit Mode</span>
                            {regionToEdit && (
                              <span className="text-dark ms-2">
                                Editing: <strong>{regionToEdit}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Sri Lanka Map Image */}
                      <img
                        src={sriLankaMapImage}
                        alt="Sri Lanka Map"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          background: "#e8f5e9",
                          cursor: adminEditMode && regionToEdit ? "crosshair" : "default",
                        }}
                        onLoad={(e) => {
                          const img = e.currentTarget;
                          const imgRect = img.getBoundingClientRect();
                          setImageSize({
                            width: imgRect.width,
                            height: imgRect.height,
                            naturalWidth: img.naturalWidth,
                            naturalHeight: img.naturalHeight,
                          });
                        }}
                        onClick={(e) => {
                          if (adminEditMode && regionToEdit && imageSize) {
                            const img = e.currentTarget;
                            const rect = img.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const y = e.clientY - rect.top;
                            
                            // Convert click position to original image coordinates
                            const scaleX = imageSize.naturalWidth / imageSize.width;
                            const scaleY = imageSize.naturalHeight / imageSize.height;
                            const originalX = Math.round(x * scaleX);
                            const originalY = Math.round(y * scaleY);
                            
                            // Update the region coordinates
                            setRegions(prevRegions =>
                              prevRegions.map(region =>
                                region.name === regionToEdit
                                  ? { ...region, coordinates: [originalX, originalY] }
                                  : region
                              )
                            );
                            setHasUnsavedChanges(true);
                          }
                        }}
                      />
                      
                      {/* Tea Region Markers */}
                      {regions.map((region) => {
                        // Calculate scaled coordinates based on displayed image size
                        let left = region.coordinates[0];
                        let top = region.coordinates[1];
                        
                        if (imageSize) {
                          const scaleX = imageSize.width / imageSize.naturalWidth;
                          const scaleY = imageSize.height / imageSize.naturalHeight;
                          left = region.coordinates[0] * scaleX;
                          top = region.coordinates[1] * scaleY;
                        }
                        
                        return (
                        <div
                          key={region.name}
                          onClick={() => setSelectedRegion(region)}
                          style={{
                            position: "absolute",
                            left: `${left}px`,
                            top: `${top}px`,
                            transform: "translate(-50%, -50%)",
                            cursor: "pointer",
                            zIndex: selectedRegion?.name === region.name ? 10 : 5,
                          }}
                        >
                          {/* Pulsing effect for selected region */}
                          {selectedRegion?.name === region.name && (
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                backgroundColor: region.color,
                                opacity: 0.4,
                                animation: "pulse 2s infinite",
                              }}
                            />
                          )}
                          {/* Shadow */}
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "50%",
                              transform: "translate(-45%, -45%)",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: "rgba(0,0,0,0.2)",
                            }}
                          />
                          {/* Main marker */}
                          <div
                            style={{
                              position: "relative",
                              width: "12px",
                              height: "12px",
                              borderRadius: "50%",
                              backgroundColor: region.color,
                              border: "2px solid white",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                              transition: "all 0.3s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            {/* Inner dot */}
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: "50%",
                                transform: "translate(-50%, -50%)",
                                width: "5px",
                                height: "5px",
                                borderRadius: "50%",
                                backgroundColor: "white",
                              }}
                            />
                          </div>
                          {/* Label */}
                          <div
                            style={{
                              position: "absolute",
                              left: "50%",
                              top: "-25px",
                              transform: "translateX(-50%)",
                              backgroundColor: "white",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              border: `1px solid ${region.color}`,
                              fontSize: "9px",
                              fontWeight: "bold",
                              color: region.color,
                              whiteSpace: "nowrap",
                              pointerEvents: "none",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                          >
                            {region.name.split(" ")[0]}
                          </div>
                        </div>
                      );
                      })}
                      
                      <style>{`
                        @keyframes pulse {
                          0%, 100% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.3); }
                        }
                      `}</style>
                      <div className="position-absolute top-0 start-0 p-3">
                        <small className="text-dark bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm">
                          Click on markers to view details
                        </small>
                      </div>
                      <div className="position-absolute top-0 end-0 p-3">
                        <div className="bg-white bg-opacity-90 px-2 py-1 rounded shadow-sm">
                        </div>
                      </div>
                    </div>
                    {/* Region Legend */}
                    <div className="mt-3">
                      <h6 className="fw-bold text-dark mb-2">Region Legend:</h6>
                      <div className="row g-2">
                        {teaRegions.map((region) => (
                          <div key={region.name} className="col-6 col-md-4">
                            <div
                              className="d-flex align-items-center gap-2 p-2 rounded"
                              style={{
                                backgroundColor: selectedRegion?.name === region.name ? region.color + "20" : "transparent",
                                cursor: "pointer",
                              }}
                              onClick={() => setSelectedRegion(region)}
                            >
                              <div
                                style={{
                                  width: "15px",
                                  height: "15px",
                                  borderRadius: "50%",
                                  backgroundColor: region.color,
                                }}
                              />
                              <small className="text-dark fw-bold">{region.name.split(" ")[0]}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Region Details */}
              <div className="col-12 col-lg-6">
                {regions.find(r => r.name === selectedRegion?.name) ? (
                  (() => {
                    const currentRegion = regions.find(r => r.name === selectedRegion?.name) || selectedRegion;
                    return currentRegion ? (
                  <motion.div
                    key={currentRegion.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="card shadow-lg border-0 h-100"
                    style={{
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.95)",
                    }}
                  >
                    <div
                      className="card-header text-white"
                      style={{
                        backgroundColor: currentRegion.color,
                        borderRadius: "20px 20px 0 0",
                      }}
                    >
                      <h3 className="fw-bold mb-0">{currentRegion.name}</h3>
                    </div>
                    <div className="card-body p-4">
                      <p className="text-muted mb-3">{currentRegion.description}</p>
                      {isAdmin && adminEditMode && (
                        <div className="alert alert-warning mb-3">
                          <small>
                            <strong>Coordinates:</strong> ({currentRegion.coordinates[0]}, {currentRegion.coordinates[1]})
                          </small>
                        </div>
                      )}
                      <div className="mb-3">
                        <h6 className="fw-bold text-dark">
                          <FiMapPin className="me-2" />
                          Origin:
                        </h6>
                        <p className="text-muted mb-0">{currentRegion.origin}</p>
                      </div>
                      <div className="mb-3">
                        <h6 className="fw-bold text-dark">
                          <FiSun className="me-2" />
                          Altitude:
                        </h6>
                        <p className="text-muted mb-0">{currentRegion.altitude}</p>
                      </div>
                      <div className="mb-3">
                        <h6 className="fw-bold text-dark">
                          <FiInfo className="me-2" />
                          Characteristics:
                        </h6>
                        <p className="text-muted mb-0">{currentRegion.characteristics}</p>
                      </div>
                      <div>
                        <h6 className="fw-bold text-dark mb-2">Flavor Notes:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {currentRegion.flavorNotes.map((note, idx) => (
                            <span
                              key={idx}
                              className="badge rounded-pill px-3 py-2"
                              style={{ backgroundColor: currentRegion.color + "40", color: currentRegion.color }}
                            >
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                    ) : null;
                  })()
                ) : (
                  <div
                    className="card shadow-lg border-0 h-100 d-flex align-items-center justify-content-center"
                    style={{
                      borderRadius: "20px",
                      background: "rgba(255, 255, 255, 0.95)",
                      minHeight: "400px",
                    }}
                  >
                    <div className="text-center p-4">
                      <FiMapPin size={64} className="text-muted mb-3" />
                      <h5 className="text-muted">Select a region to view details</h5>
                      <p className="text-muted">Click on a marker on the map or select from the legend</p>
                    </div>
                  </div>
                )}
              </div>

              {/* All Regions Grid */}
              <div className="col-12 mt-4">
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                  }}
                >
                  <div className="card-body p-4">
                    <h3 className="fw-bold text-dark mb-4">All Seven Tea Regions</h3>
                    <div className="row g-3">
                      {regions.map((region) => (
                        <div key={region.name} className="col-12 col-md-6 col-lg-4">
                          <div
                            className="card h-100 border-0 shadow-sm"
                            style={{
                              borderRadius: "15px",
                              cursor: "pointer",
                              transition: "all 0.3s",
                              borderLeft: `4px solid ${region.color}`,
                            }}
                            onClick={() => setSelectedRegion(region)}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "translateY(-5px)";
                              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                            }}
                          >
                            <div className="card-body">
                              <h6 className="fw-bold text-dark mb-2">{region.name}</h6>
                              <p className="text-muted small mb-2">{region.description.substring(0, 100)}...</p>
                              <div className="d-flex flex-wrap gap-1">
                                {region.flavorNotes.slice(0, 2).map((note, idx) => (
                                  <span
                                    key={idx}
                                    className="badge rounded-pill"
                                    style={{ backgroundColor: region.color + "30", color: region.color, fontSize: "0.7rem" }}
                                  >
                                    {note}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Brewing Guide Section */}
          {activeSection === "brewing" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="row justify-content-center"
            >
              <div className="col-12 col-lg-10">
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                  }}
                >
                  <div className="card-body p-5">
                    <h2 className="fw-bold text-dark mb-4">
                      <FiThermometer className="me-2 text-primary" />
                      Perfect Tea Brewing Guide
                    </h2>

                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiThermometer className="me-2 text-danger" />
                              Temperature
                            </h5>
                            <p className="display-6 fw-bold text-primary mb-0">{brewingConditions.temperature}</p>
                            <small className="text-muted">Optimal brewing temperature range</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiClock className="me-2 text-info" />
                              Steeping Time
                            </h5>
                            <p className="display-6 fw-bold text-info mb-0">{brewingConditions.time}</p>
                            <small className="text-muted">Recommended steeping duration</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row g-4 mb-4">
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiDroplet className="me-2 text-primary" />
                              Water Quality
                            </h5>
                            <p className="fw-bold text-dark mb-0">{brewingConditions.water}</p>
                            <small className="text-muted">Use clean, filtered water for best results</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiInfo className="me-2 text-success" />
                              Tea to Water Ratio
                            </h5>
                            <p className="fw-bold text-dark mb-0">{brewingConditions.ratio}</p>
                            <small className="text-muted">Standard measurement for perfect strength</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", backgroundColor: "#f8f9fa" }}>
                      <div className="card-body p-4">
                        <h5 className="fw-bold text-dark mb-3">
                          <FiCheckCircle className="me-2 text-success" />
                          Brewing Tips
                        </h5>
                        <ul className="list-unstyled mb-0">
                          {brewingConditions.tips.map((tip, index) => (
                            <li key={index} className="mb-2 d-flex align-items-start">
                              <FiCheckCircle className="me-2 text-success mt-1" size={18} />
                              <span className="text-dark">{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Image Capture Guide Section */}
          {activeSection === "capture" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="row justify-content-center"
            >
              <div className="col-12 col-lg-10">
                <div
                  className="card shadow-lg border-0"
                  style={{
                    borderRadius: "20px",
                    background: "rgba(255, 255, 255, 0.95)",
                  }}
                >
                  <div className="card-body p-5">
                    <h2 className="fw-bold text-dark mb-4">
                      <FiCamera className="me-2 text-primary" />
                      Image Capture Guidelines
                    </h2>
                    <p className="text-muted mb-4">
                      Follow these guidelines to capture high-quality tea images for accurate region classification.
                    </p>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiCamera className="me-2 text-primary" />
                              Setup Requirements
                            </h5>
                            <ul className="list-unstyled mb-0">
                              {imageCaptureGuidelines.setup.map((item, index) => (
                                <li key={index} className="mb-2 d-flex align-items-start">
                                  <FiCheckCircle className="me-2 text-success mt-1" size={16} />
                                  <small className="text-dark">{item}</small>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiSun className="me-2 text-warning" />
                              Lighting Conditions
                            </h5>
                            <ul className="list-unstyled mb-0">
                              {imageCaptureGuidelines.lighting.map((item, index) => (
                                <li key={index} className="mb-2 d-flex align-items-start">
                                  <FiCheckCircle className="me-2 text-success mt-1" size={16} />
                                  <small className="text-dark">{item}</small>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiInfo className="me-2 text-info" />
                              Sample Preparation
                            </h5>
                            <ul className="list-unstyled mb-0">
                              {imageCaptureGuidelines.sample.map((item, index) => (
                                <li key={index} className="mb-2 d-flex align-items-start">
                                  <FiCheckCircle className="me-2 text-success mt-1" size={16} />
                                  <small className="text-dark">{item}</small>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: "15px" }}>
                          <div className="card-body">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiCamera className="me-2 text-primary" />
                              Camera Settings
                            </h5>
                            <ul className="list-unstyled mb-0">
                              {imageCaptureGuidelines.camera.map((item, index) => (
                                <li key={index} className="mb-2 d-flex align-items-start">
                                  <FiCheckCircle className="me-2 text-success mt-1" size={16} />
                                  <small className="text-dark">{item}</small>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: "15px", backgroundColor: "#f8f9fa" }}>
                          <div className="card-body p-4">
                            <h5 className="fw-bold text-dark mb-3">
                              <FiCheckCircle className="me-2 text-success" />
                              Post-Processing Guidelines
                            </h5>
                            <ul className="list-unstyled mb-0">
                              {imageCaptureGuidelines.postProcessing.map((item, index) => (
                                <li key={index} className="mb-2 d-flex align-items-start">
                                  <FiCheckCircle className="me-2 text-success mt-1" size={16} />
                                  <small className="text-dark">{item}</small>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
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
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default TeaRegionsGuide;

