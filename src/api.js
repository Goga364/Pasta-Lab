import axios from "axios";

const baseURL =
  "/proxy/api/1";

const api = axios.create({ baseURL });

let token = null;

async function fetchToken() {
  try {
    const response = await axios.post(`${baseURL}/access_token`, {
      apiLogin: "5da1f78c0df744f3ababc3930953b4bc",
    });
    token = response.data.token;
    return token;
  } catch (error) {
    console.error("Failed to fetch token:", error);
    throw error;
  }
}

api.interceptors.request.use(
  async (config) => {
    if (!token) {
      token = await fetchToken();
    }

    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      token = await fetchToken();
      originalRequest.headers["Authorization"] = `Bearer ${token}`;
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
