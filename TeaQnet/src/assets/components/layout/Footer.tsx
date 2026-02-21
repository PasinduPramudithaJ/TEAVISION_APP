import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };
  return (
    <footer className="text-white text-center py-4 mt-auto"  style={{ backgroundColor: '#1E5F16' }}>
      <div className="container">
        <div className="container p-4 pb-0">
          {/* Section: Links */}
          <section>
            <div className="row">
              {/* Company info */}
              <div className="col-md-3 col-lg-3 col-xl-3 mx-auto mt-3">
                <h6 className="text-uppercase mb-4 font-weight-bold">
                  TeaVision
                </h6>
                <p>
                  TeaVision is a research-driven platform specializing in deep learning-based tea quality evaluation,
                  empowering producers with expert-level assessment tools using standardized colorimetric analysis.
                </p>
              </div>

              <hr className="w-100 clearfix d-md-none" />

              {/* Products */}
              <div className="col-md-2 col-lg-2 col-xl-2 mx-auto mt-3">
                <h6 className="text-uppercase mb-4 font-weight-bold">Technologies</h6>
                <p><Link to="#" className="text-white text-decoration-none">Deep Learning</Link></p>
                <p><Link to="#" className="text-white text-decoration-none">Computer Vision</Link></p>
                <p><Link to="#" className="text-white text-decoration-none">Colorimetric Analysis</Link></p>
                <p><Link to="#" className="text-white text-decoration-none">Plant Research</Link></p>
              </div>

              <hr className="w-100 clearfix d-md-none" />

              {/* Useful links */}
              <div className="col-md-3 col-lg-2 col-xl-2 mx-auto mt-3">
                <h6 className="text-uppercase mb-4 font-weight-bold">
                  Useful links
                </h6>
                <p><Link to="#" className="text-white text-decoration-none">Research Paper</Link></p>
                <p><Link to="#" className="text-white text-decoration-none">Publications</Link></p>
                <p><Link to="#" className="text-white text-decoration-none" onClick={scrollToTop}>Home</Link></p>
                <p><Link to="#" className="text-white text-decoration-none">Contact Us</Link></p>
              </div>

              <hr className="w-100 clearfix d-md-none" />

              {/* Contact */}
              <div id='contact' className="col-md-4 col-lg-3 col-xl-3 mx-auto mt-3">
                <h6 className="text-uppercase mb-4 font-weight-bold">Contact</h6>
                <p><i className="fas fa-home mr-3"></i> University of Kelaniya, Sri Lanka</p>
                <p><i className="fas fa-envelope mr-3"></i> teavision.research@gmail.com</p>
                <p><i className="fas fa-phone mr-3"></i> +94 77 123 4567</p>
              </div>
            </div>
          </section>
        </div>

        <p className="mb-2 mt-3">&copy; 2025 TeaVision. All Rights Reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
