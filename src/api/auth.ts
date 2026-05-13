import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5001/api",
});

export function login(data: { username: string; password: string }) {
  return api.post("/auth/login", data);
}
