// Base URL for the backend API.
// During development, the backend runs on port 5000.
// In production, set NEXT_PUBLIC_API_URL in your environment variables.
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default API_BASE;
