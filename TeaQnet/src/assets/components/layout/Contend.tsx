import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiUpload, FiZap, FiBarChart2, FiShield, FiAward, FiUsers } from "react-icons/fi";
import image1 from "../../../assets/images/teaplant5.jpg";
import image4 from "../../../assets/images/teaplant4.jpg";
import image6 from "../../../assets/images/teaplant6.jpg";
import image3 from "../../../assets/images/teaplant3.jpg";

const Contend: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const features = [
    {
      icon: <FiZap />,
      title: "AI-Powered Analysis",
      description: "Advanced deep learning models for precise tea quality assessment",
      color: "text-warning"
    },
    {
      icon: <FiBarChart2 />,
      title: "Real-time Predictions",
      description: "Instant results with detailed confidence scores and analytics",
      color: "text-info"
    },
    {
      icon: <FiShield />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security for your tea quality data",
      color: "text-success"
    },
    {
      icon: <FiAward />,
      title: "Expert-Level Grading",
      description: "Professional quality assessment matching industry standards",
      color: "text-danger"
    }
  ];

  const steps = [
    {
      img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80",
      title: "1. Upload",
      desc: "Upload a high-quality tea liquor image through our secure platform.",
      icon: <FiUpload />
    },
    {
      img: image6,
      title: "2. Analyze",
      desc: "Our AI analyzes color gradients and unique features for precise grading.",
      icon: <FiZap />
    },
    {
      img: image3,
      title: "3. Get Results",
      desc: "Instantly receive an expert-level tea quality report and insights.",
      icon: <FiBarChart2 />
    },
  ];

  return (
    <>
      <div className="bg-light min-vh-100 d-flex flex-column">
        {/* Hero Section with Gradient Overlay */}
        <div
          className="flex-grow-1 d-flex flex-column align-items-center justify-content-center text-center py-5 position-relative"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${image1})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundAttachment: "fixed",
            color: "white",
            minHeight: "90vh"
          }}
        >
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
            background: "linear-gradient(135deg, rgba(20, 105, 10, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)"
          }}></div>
          
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="position-relative z-1"
            style={{ maxWidth: "900px", padding: "0 20px" }}
          >
            <motion.h1
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="display-2 fw-bold mb-4"
              style={{ 
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                background: "linear-gradient(135deg, #fff 0%, #f0f0f0 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                marginTop: "40px"
              }}
            >
              TeaVision
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="lead mb-4 fs-4"
              style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}
            >
              Revolutionizing Tea Quality Assessment through Deep Learning
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mb-5 text-light"
            >
              Experience the future of tea quality analysis with cutting-edge AI technology
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={handleGetStarted}
              className="btn btn-warning btn-lg px-5 py-3 rounded-pill shadow-lg"
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                border: "none",
                marginBottom: "120px"
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started <FiArrowRight className="ms-2" />
            </motion.button>
          </motion.div>
          <br /><br /><br />

          {/* Floating Features */}
          <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4 w-100" style={{ maxWidth: "1200px", zIndex: 1 }}>
            <div className="row g-3 px-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  className="col-6 col-md-3 d-none d-md-block"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <div className="card bg-dark bg-opacity-75 text-white border-0 shadow-lg h-100" style={{ backdropFilter: "blur(10px)" }}>
                    <div className="card-body text-center p-3">
                      <div className={`display-6 mb-2 ${feature.color}`}>{feature.icon}</div>
                      <h6 className="card-title mb-1" style={{ fontSize: "0.9rem" }}>{feature.title}</h6>
                      <p className="card-text small text-light" style={{ fontSize: "0.75rem" }}>{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* About Section with Modern Design */}
        <div className="container py-5 my-5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="row align-items-center"
          >
            <div className="col-12 col-md-6 mb-4 mb-md-0">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={image4}
                  alt="Fresh Tea Leaves"
                  className="img-fluid rounded shadow-lg"
                  style={{ 
                    borderRadius: "20px",
                    transform: "perspective(1000px) rotateY(-5deg)",
                    transition: "transform 0.3s ease"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "perspective(1000px) rotateY(0deg) scale(1.02)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "perspective(1000px) rotateY(-5deg) scale(1)"}
                />
              </motion.div>
            </div>
            <div className="col-12 col-md-6">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="mb-4 fw-bold" style={{ 
                  background: "linear-gradient(135deg, #14690A 0%, #28a745 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text"
                }}>
                  About TeaVision
                </h2>
                <p className="lead text-muted mb-3">
                  TeaVision utilizes AI and deep learning models to assess tea
                  quality based on liquor color profiles. Our smart solution
                  ensures consistent and expert-level grading for premium tea
                  quality assurance.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button className="btn btn-success btn-lg rounded-pill px-4 shadow">
                    Discover More
                  </button>
                  <button className="btn btn-outline-success btn-lg rounded-pill px-4">
                    Learn More
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* How It Works Section with Enhanced Design */}
        <div className="py-5 position-relative" style={{
          background: "linear-gradient(135deg, #14690A 0%, #28a745 100%)",
          overflow: "hidden"
        }}>
          <div className="position-absolute top-0 start-0 w-100 h-100" style={{
            background: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.05\"%3E%3Cpath d=\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
          }}></div>
          
          <div className="container text-center position-relative" style={{ zIndex: 1 }}>
            <motion.h2
              initial={{ opacity: 0, y: -30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-5 text-white fw-bold"
              style={{ fontSize: "2.5rem", textShadow: "2px 2px 4px rgba(0,0,0,0.3)" }}
            >
              How It Works
            </motion.h2>
            <div className="row g-4">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  className="col-12 col-md-4 mb-4"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <div className="card h-100 shadow-lg border-0 overflow-hidden" style={{
                    borderRadius: "20px",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease",
                    background: "rgba(255,255,255,0.95)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-10px)";
                    e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.1)";
                  }}
                  >
                    <div className="position-relative" style={{ height: "250px", overflow: "hidden" }}>
                      <img
                        src={step.img}
                        alt={step.title}
                        className="w-100 h-100"
                        style={{ objectFit: "cover", transition: "transform 0.3s ease" }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                      />
                      <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{
                          background: "linear-gradient(135deg, rgba(20, 105, 10, 0.8) 0%, rgba(0, 0, 0, 0.6) 100%)",
                          opacity: 0,
                          transition: "opacity 0.3s ease"
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                      >
                        <div className="display-1 text-white">{step.icon}</div>
                      </div>
                    </div>
                    <div className="card-body p-4">
                      <h5 className="card-title text-success fw-bold mb-3">{step.title}</h5>
                      <p className="card-text text-muted">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container py-5 my-5">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="row g-4 text-center"
          >
            {[
              { icon: <FiUsers />, number: "10K+", label: "Users" },
              { icon: <FiBarChart2 />, number: "50K+", label: "Predictions" },
              { icon: <FiAward />, number: "99%", label: "Accuracy" },
              { icon: <FiZap />, number: "<1s", label: "Response Time" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                className="col-6 col-md-3"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="card border-0 shadow-lg h-100" style={{ borderRadius: "15px" }}>
                  <div className="card-body p-4">
                    <div className="display-4 text-success mb-2">{stat.icon}</div>
                    <h3 className="fw-bold text-success">{stat.number}</h3>
                    <p className="text-muted mb-0">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Contend;
