import React, { JSX, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiLogOut, FiLayers,
  FiHome, FiSettings, FiCheckCircle, FiAlertCircle, FiActivity,
  FiUsers, FiBarChart2, FiTool, FiShield, FiUser, FiTrendingUp, FiRefreshCw,
  FiBox,
  
} from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import image1 from "../../images/background2.jpg";
import { motion } from "framer-motion";
import UserManagement from "../admin/UserManagement";
import AdminStats from "../admin/AdminStats";
import { getAdminStats, AdminStats as AdminStatsType } from "../../../utils/api";


interface BackendStatus {
  status: string;
  message?: string;
  model_loaded?: boolean;
  cpu?: number;
  memory?: number;
}

interface FeatureBlock {
  label: string;
  icon: JSX.Element;
  route: string;
  color: string;
  description: string;
}

const featureBlocks: FeatureBlock[] = [
  { label: "Feature Extraction", icon: <FiLayers />, route: "/feature_extraction", color: "primary", description: "Upload multiple images and extract features from them." },
  { label: "Tea Region & Group Prediction", icon: <FiActivity />, route: "/tea_region_group_prediction", color: "success", description: "Perform prediction for a tea regions and groups." },
  { label: "Combined Feature & Region and Group Prediction", icon: <FiBox />, route: "/combined_feature_region", color: "info", description: "Combined the feature extraction and region and group prediction" },
  { label: "Combined Tea Pipeline", icon: <FiTrendingUp />, route: "/combined_tea_pipeline", color: "danger", description: "Combined tea Pipeline for automatic classification and prediction." },
 // { label: "Model Comparison", icon: <FiServer />, route: "/comparison", color: "secondary", description: "Compare different models and their performance." },
  { label: "API Settings", icon: <FiSettings />, route: "/settings", color: "warning", description: "Change API and model settings (Admin Only)" },
 //{ label: "Polyphenol Based Predict", icon: <FiGrid />, route: "/polyphenol", color: "success", description: "Predict polyphenol content from tea leaf images." },
 //{ label: "Combined Pipeline", icon: <FiPlusSquare />, route: "/combined_tea_pipeline", color: "primary", description: "Run the full pipeline from feature extraction to prediction in one step." },
  { label: "All Users History", icon: <FiBarChart2 />, route: "/admin/history", color: "pink", description: "View and manage all users' prediction history." },
  { label: "Home", icon: <FiHome />, route: "/", color: "dark", description: "Return to the main homepage. New features coming soon!" },
];

type TabType = 'overview' | 'users' | 'stats' | 'tools';

const SuperDashboard: React.FC = () => {
  const [apiUrl, setApiUrl] = useState<string>(`http://${window.location.hostname}:5000`);
  const [connectionStatus, setConnectionStatus] = useState<string>("Checking...");
  const [backendInfo, setBackendInfo] = useState<BackendStatus | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [currentUser, setCurrentUser] = useState<{ email: string; is_admin: boolean } | null>(null);
  const [quickStats, setQuickStats] = useState<AdminStatsType | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Get current user info
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  // Health check
  useEffect(() => {
    const checkHealth = async () => {
      const savedUrl = localStorage.getItem("backend_url");
      const url = savedUrl || `http://${window.location.hostname}:5000`;
      setApiUrl(url);
      try {
        const res = await fetch(`${url}/health`);
        const data = await res.json();
        if (res.status === 200) {
          setConnectionStatus("🟢 Connected");
          setBackendInfo({
            status: data.status,
            message: data.message,
            model_loaded: data.model_loaded,
            cpu: data.cpu,
            memory: data.memory,
          });
        } else {
          setConnectionStatus("🔴 Unreachable");
        }
      } catch {
        setConnectionStatus("🔴 Offline");
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, []);

  // Load quick stats
  useEffect(() => {
    const loadQuickStats = async () => {
      try {
        setStatsLoading(true);
        const data = await getAdminStats();
        setQuickStats(data);
      } catch (err) {
        console.error('Failed to load quick stats:', err);
      } finally {
        setStatsLoading(false);
      }
    };
    loadQuickStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isSignedIn");
    localStorage.removeItem("user");
    navigate("/");
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: <FiActivity /> },
    { id: 'users' as TabType, label: 'User Management', icon: <FiUsers /> },
    { id: 'stats' as TabType, label: 'Statistics', icon: <FiBarChart2 /> },
    { id: 'tools' as TabType, label: 'System Tools', icon: <FiTool /> },
  ];

  return (
    <>
      <Header />
      <div
        className="flex-grow-1 d-flex flex-column py-3 text-light"
        style={{
          backgroundImage: `url(${image1})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "88vh",
          position: "relative",
          paddingTop: "100px",
        }}
      >
        {/* Header with Logout */}
        <div className="d-flex justify-content-between align-items-center px-4 mb-3">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-shadow mb-0">🌿 TeaQnet Admin Dashboard</h2>
            {currentUser && (
              <small className="text-muted">Logged in as: {currentUser.email}</small>
            )}
          </motion.div>
          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            <FiLogOut /> Logout
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="container-fluid px-4 mb-3">
          <ul className="nav nav-tabs nav-justified bg-dark bg-opacity-75 rounded-top">
            {tabs.map((tab) => (
              <li key={tab.id} className="nav-item">
                <button
                  className={`nav-link ${activeTab === tab.id ? 'active' : ''} text-light`}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span className="me-2">{tab.icon}</span>
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Tab Content */}
        <div className="container-fluid px-4 flex-grow-1" style={{ overflowY: 'auto' }}>
          <div className="bg-dark bg-opacity-75 rounded-bottom p-4" style={{ minHeight: '60vh' }}>
            {activeTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="mb-4 text-light">System Overview</h3>
                
                {/* Backend Status Panel */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="card bg-dark text-light shadow-lg mb-3">
                      <div className="card-body">
                        <h5 className="card-title">
                          <FiActivity className="me-2" />
                          Backend Status
                        </h5>
                        <p className="mb-2">
                          <strong>Status:</strong> {connectionStatus}
                        </p>
                        <p className="mb-2">
                          <strong>URL:</strong> {apiUrl}
                        </p>
                        {backendInfo && (
                          <>
                            <p className="mb-2">{backendInfo.message}</p>
                            {backendInfo.model_loaded ? (
                              <span className="badge bg-success">
                                <FiCheckCircle /> Model Loaded
                              </span>
                            ) : (
                              <span className="badge bg-danger">
                                <FiAlertCircle /> Model Missing
                              </span>
                            )}
                            {backendInfo.cpu !== undefined && (
                              <div className="mt-3">
                                <small>
                                  CPU: {backendInfo.cpu}% | Memory: {backendInfo.memory}%
                                </small>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-dark text-light shadow-lg mb-3">
                      <div className="card-body">
                        <h5 className="card-title">
                          <FiUsers className="me-2" />
                          Quick Actions
                        </h5>
                        <div className="d-grid gap-2">
                          <button
                            className="btn btn-primary"
                            onClick={() => setActiveTab('users')}
                          >
                            <FiUsers className="me-2" />
                            Manage Users
                          </button>
                          <button
                            className="btn btn-info"
                            onClick={() => setActiveTab('stats')}
                          >
                            <FiBarChart2 className="me-2" />
                            View Statistics
                          </button>
                          <button
                            className="btn btn-warning"
                            onClick={() => navigate('/settings')}
                          >
                            <FiSettings className="me-2" />
                            API Settings
                          </button>
                          <button
                            className="btn btn-success"
                            onClick={() => navigate('/admin/history')}
                          >
                            <FiBarChart2 className="me-2" />
                            View All History
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Preview */}
                <div className="card bg-dark text-light shadow-lg">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="card-title mb-0">
                      <FiBarChart2 className="me-2" />
                      Quick Stats Preview
                    </h5>
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={async () => {
                        try {
                          setStatsLoading(true);
                          const data = await getAdminStats();
                          setQuickStats(data);
                        } catch (err) {
                          console.error('Failed to refresh stats:', err);
                        } finally {
                          setStatsLoading(false);
                        }
                      }}
                      disabled={statsLoading}
                    >
                      <FiRefreshCw className={statsLoading ? "spinning" : ""} />
                    </button>
                  </div>
                  <div className="card-body">
                    {statsLoading ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm text-light" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : quickStats ? (
                      <div className="row g-3">
                        <div className="col-md-3 col-sm-6">
                          <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <FiUsers className="me-3" style={{ fontSize: '2rem', color: '#0d6efd' }} />
                            <div>
                              <small className="text-muted d-block"><span style={{ color: "white" }}>Total Users</span></small>
                              <h4 className="mb-0">{quickStats.total_users}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                          <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <FiShield className="me-3" style={{ fontSize: '2rem', color: '#ffc107' }} />
                            <div>
                              <small className="text-muted d-block"><span style={{ color: "white" }}>Admin Users</span></small>
                              <h4 className="mb-0">{quickStats.admin_users}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                          <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <FiUser className="me-3" style={{ fontSize: '2rem', color: '#0dcaf0' }} />
                            <div>
                              <small className="text-muted d-block"><span style={{ color: "white" }}>Regular Users</span></small>
                              <h4 className="mb-0">{quickStats.regular_users}</h4>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-3 col-sm-6">
                          <div className="d-flex align-items-center p-3 rounded" style={{ background: 'rgba(255,255,255,0.1)' }}>
                            <FiTrendingUp className="me-3" style={{ fontSize: '2rem', color: '#198754' }} />
                            <div>
                              <small className="text-muted d-block"><span style={{ color: "white" }}>This Month</span></small>
                              <h4 className="mb-0">{quickStats.users_month}</h4>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted mb-0">Failed to load statistics</p>
                    )}
                    <div className="mt-3 text-center">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setActiveTab('stats')}
                      >
                        View Full Statistics <FiBarChart2 className="ms-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'users' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <UserManagement />
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <AdminStats />
              </motion.div>
            )}

            {activeTab === 'tools' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="mb-4 text-light">System Tools</h3>
                <div className="row g-4">
                  {featureBlocks.map((block, idx) => (
                    <div key={idx} className="col-md-4 col-sm-6">
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        className={`card text-light shadow-lg p-4 rounded-4 text-center ${block.color === 'pink' ? '' : `bg-${block.color}`}`}
                        style={{ 
                          cursor: "pointer", 
                          minHeight: "200px",
                          backgroundColor: block.color === 'pink' ? '#db7093' : undefined
                        }}
                      >
                        <div className="display-4 mb-3">{block.icon}</div>
                        <h5>{block.label}</h5>
                        <p className="small">{block.description}</p>
                        <div className="d-flex justify-content-center mt-3">
                          <button
                            className="btn btn-light w-75"
                            onClick={() => navigate(block.route)}
                          >
                            Go
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spinning {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </>
  );
};

export default SuperDashboard;
