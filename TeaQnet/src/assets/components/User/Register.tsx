import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import backgroundImage from '../../images/background.jpeg';
import { registerUser } from '../../../utils/api';
import { FiUserPlus, FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight, FiCheckCircle } from 'react-icons/fi';

const Register: React.FC = () => {
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(email, password);
      
      if (response.user.is_admin) {
        localStorage.setItem('isSignedIn', 'true');
        localStorage.setItem('user', JSON.stringify(response.user));
        alert('Admin registered successfully!');
        navigate('/super');
      } else {
        alert('Registered successfully! Please log in.');
        navigate('/login');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password.length >= 4 ? 'strong' : password.length >= 2 ? 'medium' : 'weak';

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
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                }}
              >
                <FiUserPlus size={40} className="text-white" />
              </motion.div>
              <h2 className="fw-bold mb-2">Create Account</h2>
              <p className="text-muted">Join TeaVision today</p>
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

            <form onSubmit={handleRegister}>
              <div className="mb-4">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiMail className="text-success" />
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

              <div className="mb-3">
                <label className="form-label fw-bold d-flex align-items-center gap-2">
                  <FiLock className="text-success" />
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
                    placeholder="Enter your password (min 4 characters)"
                    required
                    className="form-control border-start-0 border-end-0"
                    disabled={isLoading}
                    minLength={4}
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
                {password && (
                  <div className="mt-2">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <div
                        className="flex-grow-1"
                        style={{
                          height: '4px',
                          borderRadius: '2px',
                          background: passwordStrength === 'strong' 
                            ? '#28a745' 
                            : passwordStrength === 'medium' 
                            ? '#ffc107' 
                            : '#dc3545',
                          transition: 'all 0.3s ease',
                        }}
                      />
                      {password.length >= 4 && (
                        <FiCheckCircle className="text-success" />
                      )}
                    </div>
                    <small className={`text-${passwordStrength === 'strong' ? 'success' : passwordStrength === 'medium' ? 'warning' : 'danger'}`}>
                      {passwordStrength === 'strong' 
                        ? 'Strong password' 
                        : passwordStrength === 'medium' 
                        ? 'Medium strength' 
                        : 'Weak password'}
                    </small>
                  </div>
                )}
              </div>

              <motion.button
                type="submit"
                className="btn btn-success w-100 rounded-pill py-3 shadow-lg fw-bold d-flex align-items-center justify-content-center gap-2"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Registering...
                  </>
                ) : (
                  <>
                    Create Account <FiArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            <div className="text-center mt-4">
              <small className="text-muted">
                Already have an account?{' '}
                <Link
                  className="text-primary text-decoration-none fw-bold"
                  to="/login"
                  style={{ transition: 'all 0.3s ease' }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Login now!
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

export default Register;
