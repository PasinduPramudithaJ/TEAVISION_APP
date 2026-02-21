import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiInfo, FiMail, FiLogIn, FiMenu, FiX, FiUser, FiLogOut, FiShield, FiClock, FiSettings, FiMessageCircle, FiMapPin } from 'react-icons/fi';
import { getProfilePictureUrl } from '../../../utils/api';

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<{ email: string; is_admin: boolean; profile_picture_url?: string | null } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
      const storedUser = localStorage.getItem('user');
      
      if (isSignedIn && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setIsLoggedIn(true);
          setUser(userData);
        } catch (e) {
          setIsLoggedIn(false);
          setUser(null);
        }
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    checkAuth();
    // Check auth on storage changes
    window.addEventListener('storage', checkAuth);
    // Also check periodically in case localStorage was changed in same window
    const interval = setInterval(checkAuth, 1000);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(interval);
    };
  }, [location]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu && !(event.target as Element).closest('.nav-item.position-relative')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const scrollToMiddle = () => {
    window.scrollTo({
      top: document.body.scrollHeight / 5,
      behavior: 'smooth',
    });
    setIsMenuOpen(false);
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth',
    });
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('isSignedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setShowUserMenu(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;
  const isProtectedRoute = location.pathname !== '/' && 
                          location.pathname !== '/login' && 
                          location.pathname !== '/register';

  return (
    <motion.nav
      className={`navbar navbar-expand-lg fixed-top ${scrolled ? 'shadow-lg' : ''}`}
      style={{
        backgroundColor: scrolled ? 'rgba(20, 105, 10, 0.95)' : '#14690A',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease',
        padding: scrolled ? '0.5rem 0' : '1rem 0',
        zIndex: 1030,
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container-fluid px-4">
        <Link
          className="navbar-brand text-white fw-bold d-flex align-items-center gap-2"
          to="/"
          style={{ fontSize: '1.5rem' }}
        >
          <span style={{ fontSize: '1.8rem' }}>🍵</span>
          <motion.span
            whileHover={{ scale: 1.05 }}
            style={{
              background: 'linear-gradient(135deg, #fff 0%, #f0f0f0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            TeaVision
          </motion.span>
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}
        >
          {isMenuOpen ? (
            <FiX className="text-white" size={24} />
          ) : (
            <FiMenu className="text-white" size={24} />
          )}
        </button>

        <div
          className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`}
          id="navbarNav"
        >
          <ul className="navbar-nav ms-auto align-items-center gap-2">
            {!isProtectedRoute && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2 ${
                      isActive('/') ? 'bg-opacity-20' : ''
                    }`}
                    to="/"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive('/')) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/')) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <FiHome />
                    <b>Home</b>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                    to="/"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToMiddle();
                    }}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FiInfo />
                    <b>About</b>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className="nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                    to="/"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToBottom();
                    }}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FiMail />
                    <b>Contact</b>
                  </Link>
                </li>
                {location.pathname === "/" && (
                <li className="nav-item">
                  <Link
                    className="nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                    to="/settings"
                    onClick={() => {
                      navigate('/settings');
                      setIsMenuOpen(false);
                    }}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <FiSettings />
                    <b>Settings</b>
                  </Link>
                </li>
                )}
              </>
            )}

            {isLoggedIn && user && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2 ${
                      isActive('/tea-regions') ? 'bg-info bg-opacity-50' : ''
                    }`}
                    to="/tea-regions"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive('/tea-regions')) {
                        e.currentTarget.style.backgroundColor = 'rgba(23, 162, 184, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/tea-regions')) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <FiMapPin />
                    <b>Tea Regions</b>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link
                    className={`nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2 ${
                      isActive('/chatbot') ? 'bg-info bg-opacity-50' : ''
                    }`}
                    to="/chatbot"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive('/chatbot')) {
                        e.currentTarget.style.backgroundColor = 'rgba(23, 162, 184, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/chatbot')) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <FiMessageCircle />
                    <b>AI Assistant</b>
                  </Link>
                </li>
              </>
            )}

            {isLoggedIn && user ? (
              <li className="nav-item position-relative">
                <div
                  className="d-flex align-items-center gap-2 rounded-pill px-3 py-2 text-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  }}
                >
                  {user.profile_picture_url ? (
                    <img
                      src={getProfilePictureUrl(user.profile_picture_url) || ''}
                      alt="Profile"
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                      }}
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : user.is_admin ? (
                    <FiShield className="text-warning" size={18} />
                  ) : (
                    <FiUser size={18} />
                  )}
                  <span className="d-none d-md-inline" style={{ fontSize: '0.9rem' }}>
                    {user.email.split('@')[0]}
                  </span>
                  <span className="d-md-none" style={{ fontSize: '0.9rem' }}>
                    User
                  </span>
                </div>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="position-absolute end-0 mt-2 shadow-lg"
                    style={{
                      minWidth: '200px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '15px',
                      padding: '10px',
                      zIndex: 1000,
                      top: '100%',
                    }}
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="p-2 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        {user.profile_picture_url ? (
                          <img
                            src={getProfilePictureUrl(user.profile_picture_url) || ''}
                            alt="Profile"
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #dee2e6',
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : user.is_admin ? (
                          <FiShield className="text-warning" size={20} />
                        ) : (
                          <FiUser className="text-primary" size={20} />
                        )}
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
                            {user.email}
                          </div>
                          {user.is_admin && (
                            <small className="text-muted">Admin</small>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-2 border-bottom">
                      <button
                        className="btn btn-outline-primary btn-sm w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                          navigate('/profile');
                          setShowUserMenu(false);
                        }}
                      >
                        <FiSettings />
                        Profile Settings
                      </button>
                    </div>
                    {!user.is_admin && (
                      <div className="p-2 border-bottom">
                        <button
                          className="btn btn-primary btn-sm w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                          onClick={() => {
                            navigate('/history');
                            setShowUserMenu(false);
                          }}
                        >
                          <FiClock />
                          My History
                        </button>
                      </div>
                    )}
                    <div className="p-2 border-bottom">
                      <button
                        className="btn btn-info btn-sm w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                        onClick={() => {
                          navigate('/chatbot');
                          setShowUserMenu(false);
                        }}
                      >
                        <FiMessageCircle />
                        AI Assistant
                      </button>
                    </div>
                    <div className="p-2">
                      <button
                        className="btn btn-danger btn-sm w-100 rounded-pill d-flex align-items-center justify-content-center gap-2"
                        onClick={handleLogout}
                      >
                        <FiLogOut />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </li>
            ) : (
              !isProtectedRoute && (
                <li className="nav-item">
                  <Link
                    className={`nav-link text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2 ${
                      isActive('/login') ? 'bg-warning' : 'bg-warning bg-opacity-75'
                    }`}
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    style={{
                      transition: 'all 0.3s ease',
                      fontWeight: 'bold',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffc107';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = isActive('/login') ? '#ffc107' : 'rgba(255, 193, 7, 0.75)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <FiLogIn />
                    <b>Sign In</b>
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </motion.nav>
  );
};

export default Header;
