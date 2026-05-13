import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function getWorkOrders() {
  return api.get("/workorders/all");
}

export function createWorkOrder(data: { orderNo: string; productCode: string; quantity: number }) {
  return api.post("/workorders", data);
}
