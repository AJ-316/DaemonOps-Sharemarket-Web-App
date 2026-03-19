import axios from "axios";

const axiosPending = axios.create({ baseURL: "http://localhost:8888" });

axiosPending.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userId = localStorage.getItem("userId");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    if (role) config.headers["X-User-Role"] = role;
    if (userId) config.headers["X-User-Id"] = userId;

    return config;
});

export default axiosPending;