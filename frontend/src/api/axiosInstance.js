import axios from "axios";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8888/api",
    headers: {
        "Content-Type": "application/json",
    },
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    if (role) {
        config.headers["X-User-Role"] = role;
    }
    if (userId) config.headers["X-User-Id"] = userId;
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