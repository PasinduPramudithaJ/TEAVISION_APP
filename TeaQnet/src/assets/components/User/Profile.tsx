import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FiUser, FiCamera, FiSave, FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import image1 from '../../images/background2.jpg';
import { uploadProfilePicture, updateProfile, getProfilePictureUrl, User } from '../../../utils/api';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData: User = JSON.parse(storedUser);
        setUser(userData);
        setEmail(userData.email);
        setProfilePicture(getProfilePictureUrl(userData.profile_picture_url));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicture(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await uploadProfilePicture(file);
      setUser(response.user);
      setProfilePicture(getProfilePictureUrl(response.user.profile_picture_url));
      setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to upload profile picture' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Email cannot be empty' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const response = await updateProfile(email);
      setUser(response.user);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div
        className="min-vh-100 py-5"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${image1})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
          paddingTop: '100px',
        }}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="row justify-content-center"
          >
            <div className="col-md-8 col-lg-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="card shadow-lg border-0"
                style={{
                  borderRadius: '25px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="card-body p-5">
                  {/* Header */}
                  <div className="text-center mb-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center mb-3 position-relative"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        overflow: 'hidden',
                        margin: '0 auto',
                      }}
                    >
                      {profilePicture ? (
                        <img
                          src={profilePicture}
                          alt="Profile"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <FiUser size={60} className="text-white" />
                      )}
                    </div>
                    <h2 className="fw-bold mb-2">User Profile</h2>
                    <p className="text-muted">Manage your profile information</p>
                  </div>

                  {/* Profile Picture Upload */}
                  <div className="mb-4 text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="btn btn-outline-primary rounded-pill d-flex align-items-center justify-content-center gap-2 mx-auto"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading}
                    >
                      <FiCamera />
                      {isLoading ? 'Uploading...' : 'Change Picture'}
                    </button>
                  </div>

                  {/* User Information */}
                  <div className="mb-4">
                    <label className="form-label fw-bold d-flex align-items-center gap-2">
                      <FiUser className="text-primary" />
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-lg"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      style={{ borderRadius: '10px' }}
                    />
                  </div>

                  {/* User ID Display */}
                  {user && (
                    <div className="mb-4">
                      <small className="text-muted">User ID: {user.id}</small>
                      {user.is_admin && (
                        <div className="mt-2">
                          <span className="badge bg-warning text-dark">Admin User</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message */}
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`alert ${
                        message.type === 'success' ? 'alert-success' : 'alert-danger'
                      } mt-3 rounded-pill d-flex align-items-center gap-2`}
                    >
                      {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
                      {message.text}
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="d-grid gap-2">
                    <motion.button
                      className="btn btn-primary btn-lg rounded-pill shadow-lg d-flex align-items-center justify-content-center gap-2"
                      onClick={handleSave}
                      disabled={isLoading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {isLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FiSave />
                          Save Changes
                        </>
                      )}
                    </motion.button>
                    <button
                      className="btn btn-outline-secondary rounded-pill d-flex align-items-center justify-content-center gap-2"
                      onClick={() => navigate(-1)}
                    >
                      <FiArrowLeft />
                      Back
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Profile;

