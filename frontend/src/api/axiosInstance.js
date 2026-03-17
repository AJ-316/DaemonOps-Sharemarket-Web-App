import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8080/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Automatically attach token to every request if available
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (role) {
        config.headers["X-User-Role"] = role;
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            // window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;