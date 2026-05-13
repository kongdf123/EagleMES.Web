import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

export function getInventory() {
  return api.get("/inventory/all");
}

export function inboundInventory(data: { materialCode: string; quantity: number }) {
  return api.post("/inventory/inbound", data);
}

export function outboundInventory(data: { materialCode: string; quantity: number }) {
  return api.post("/inventory/outbound", data);
}
