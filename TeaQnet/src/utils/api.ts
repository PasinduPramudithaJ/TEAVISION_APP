/**
 * API utility functions
 */

export const getApiUrl = (): string => {
  const savedUrl = localStorage.getItem("backend_url");
  if (savedUrl) {
    return savedUrl;
  }
  return `http://${window.location.hostname}:5000`;
};

export interface User {
  id: number;
  email: string;
  is_admin: boolean;
  profile_picture_url?: string | null;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LoginResponse {
  message: string;
  user: User;
}

export interface ApiError {
  error: string;
}

/**
 * Register a new user
 */
export const registerUser = async (
  email: string,
  password: string
): Promise<RegisterResponse> => {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data as RegisterResponse;
};

/**
 * Login user
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data as LoginResponse;
};

/**
 * Admin API functions
 */

export interface AdminUser {
  id: number;
  email: string;
  is_admin: boolean;
  profile_picture_url?: string | null;
  created_at: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface AdminStats {
  total_users: number;
  admin_users: number;
  regular_users: number;
  users_today: number;
  users_week: number;
  users_month: number;
  recent_users: Array<{ email: string; created_at: string }>;
}

/**
 * Get current admin email from localStorage
 */
const getAdminEmail = (): string => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.email || "";
    } catch {
      return "";
    }
  }
  return "";
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<AdminUser[]> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/users?admin_email=${encodeURIComponent(adminEmail)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch users");
  }

  return data.users as AdminUser[];
};

/**
 * Update user (admin only)
 */
export const updateUser = async (
  userId: number,
  email?: string,
  password?: string
): Promise<void> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const body: any = { admin_email: adminEmail };
  if (email) body.email = email;
  if (password) body.password = password;

  const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update user");
  }
};

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: number): Promise<void> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
    body: JSON.stringify({ admin_email: adminEmail }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete user");
  }
};

/**
 * Toggle admin status (admin only)
 */
export const toggleAdminStatus = async (userId: number): Promise<{ is_admin: boolean }> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/users/${userId}/toggle-admin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
    body: JSON.stringify({ admin_email: adminEmail }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to toggle admin status");
  }

  return { is_admin: data.is_admin };
};

/**
 * Get admin statistics (admin only)
 */
export const getAdminStats = async (): Promise<AdminStats> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/stats?admin_email=${encodeURIComponent(adminEmail)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch statistics");
  }

  return data as AdminStats;
};

/**
 * History API functions
 */

export interface PredictionHistory {
  image_data: any;
  prediction_result: any;
  id: number;
  user_id?: number;
  user_email?: string;
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  model_name: string;
  image_type: string;
  cropped_image?: string;
  created_at: string;
}

export interface HistoryResponse {
  history: PredictionHistory[];
}

/**
 * Get current user email from localStorage
 */
const getUserEmail = (): string => {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    try {
      const user = JSON.parse(storedUser);
      return user.email || "";
    } catch {
      return "";
    }
  }
  return "";
};

/**
 * Get user's own prediction history
 */
export const getUserHistory = async (): Promise<PredictionHistory[]> => {
  const apiUrl = getApiUrl();
  const userEmail = getUserEmail();
  
  const response = await fetch(`${apiUrl}/api/history?user_email=${encodeURIComponent(userEmail)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch history");
  }

  return data.history as PredictionHistory[];
};

/**
 * Get all users' prediction history (admin only)
 */
export const getAllHistory = async (): Promise<PredictionHistory[]> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/history?admin_email=${encodeURIComponent(adminEmail)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to fetch history");
  }

  return data.history as PredictionHistory[];
};

/**
 * Delete all prediction history (admin only)
 */
export const deleteAllHistory = async (): Promise<void> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/history`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Email": adminEmail,
    },
    body: JSON.stringify({ admin_email: adminEmail }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to delete history");
  }
};

/**
 * Download user's prediction history report
 */
export const downloadUserReport = async (): Promise<void> => {
  const apiUrl = getApiUrl();
  const userEmail = getUserEmail();
  
  const response = await fetch(`${apiUrl}/api/history/report?user_email=${encodeURIComponent(userEmail)}`, {
    method: "GET",
    headers: {
      "X-User-Email": userEmail,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to download report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prediction_history_${userEmail}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Download all users' prediction history report (admin only)
 */
export const downloadAdminReport = async (): Promise<void> => {
  const apiUrl = getApiUrl();
  const adminEmail = getAdminEmail();
  
  const response = await fetch(`${apiUrl}/api/admin/history/report?admin_email=${encodeURIComponent(adminEmail)}`, {
    method: "GET",
    headers: {
      "X-Admin-Email": adminEmail,
    },
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || "Failed to download report");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all_users_prediction_history_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

/**
 * Profile API functions
 */

/**
 * Upload profile picture
 */
export const uploadProfilePicture = async (file: File): Promise<UpdateProfileResponse> => {
  const apiUrl = getApiUrl();
  const userEmail = getUserEmail();
  
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${apiUrl}/api/profile/upload-picture`, {
    method: "POST",
    headers: {
      "X-User-Email": userEmail,
    },
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to upload profile picture");
  }

  // Update localStorage with new user data
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data as UpdateProfileResponse;
};

/**
 * Update user profile
 */
export const updateProfile = async (email: string): Promise<UpdateProfileResponse> => {
  const apiUrl = getApiUrl();
  const userEmail = getUserEmail();
  
  const response = await fetch(`${apiUrl}/api/profile/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-User-Email": userEmail,
    },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to update profile");
  }

  // Update localStorage with new user data
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data as UpdateProfileResponse;
};

/**
 * Get profile picture URL (full URL)
 */
export const getProfilePictureUrl = (profilePictureUrl: string | null | undefined): string | null => {
  if (!profilePictureUrl) return null;
  
  // If already a full URL, return as is
  if (profilePictureUrl.startsWith("http")) {
    return profilePictureUrl;
  }
  
  // Otherwise, construct full URL
  const apiUrl = getApiUrl();
  return `${apiUrl}${profilePictureUrl}`;
};

/**
 * Chatbot API functions
 */

export interface ChatbotResponse {
  response: string;
  timestamp: string;
}

/**
 * Send message to chatbot
 */
export const sendChatbotMessage = async (message: string): Promise<ChatbotResponse> => {
  const apiUrl = getApiUrl();
  
  const response = await fetch(`${apiUrl}/api/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Failed to get chatbot response");
  }

  return data as ChatbotResponse;
};

