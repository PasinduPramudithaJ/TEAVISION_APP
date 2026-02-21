import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background2.jpg';
import { loginUser } from '../../../utils/api';
import { FiLogIn, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
    const storedUser = localStorage.getItem('user');
    if (isSignedIn && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const isAdmin = user.is_admin === true || user.email === 'pramudithapasindu48@gmail.com';
        if (isAdmin) {
          navigate('/super');
        } else {
          navigate('/dashboard');
        }
      } catch (e) {
        localStorage.removeItem('isSignedIn');
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);
   
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await loginUser(email, password);
      
      localStorage.setItem('isSignedIn', 'true');
      localStorage.setItem('user', JSON.stringify(response.user));
      
      if (response.user.is_admin) {
        navigate('/super');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="d-flex justify-content-center align-items-center min-vh-100 py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          paddingTop: '80px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card shadow-lg border-0"
          style={{
            width: '100%',
            maxWidth: '450px',
            borderRadius: '25px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="card-body p-5">
            {/* Header */}
            <div className="text-center mb-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="d-inline-flex align-items-center justify-content-center mb-3"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                <FiLogIn size={40} className="text-white" />
              </motion.div>
              <h2 className="fw-bold mb-2">Welcome Back</h2>
              <p className="text-muted">Sign in to your account</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="alert alert-danger rounded-pill d-flex align-items-center gap-2"
                role="alert"
              >
                <FiLock /> {error}
              </motion.div>
            )}

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiMail className="text-primary" />
                  Email address
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiMail className="text-muted" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your email"
                    required
                    className="form-control border-start-0"
                    disabled={isLoading}
                    style={{ borderRadius: '0 10px 10px 0' }}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiLock className="text-primary" />
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FiLock className="text-muted" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Enter your password"
                    required
                    className="form-control border-start-0 border-end-0"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ borderRadius: '0 10px 10px 0', cursor: 'pointer' }}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <motion.button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Sign In <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            <div className="text-center mt-4">
              <small className="text-muted">
                Don't have an account?{' '}
                <Link
                  className="text-success text-decoration-none fw-bold"
                  to="/register"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Register now!
                </Link>
              </small>
            </div>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
