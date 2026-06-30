import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

const client = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Crucial for httpOnly secure cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to format errors and extract message
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the server returned an operational error response, use its message
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred.';

    // Customize error structure for easier catch handling
    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default client;
export { API_BASE_URL };
