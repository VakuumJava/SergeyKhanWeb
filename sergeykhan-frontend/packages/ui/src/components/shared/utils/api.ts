// api.ts
import axios, { type InternalAxiosRequestConfig } from "axios";
import { API } from "@shared/constants/constants";

export const api = axios.create({
  baseURL: API,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("token");
  if (token) {
    // приводим старые заголовки к Record<string,string>,
    // добавляем Authorization и обратно кастим в нужный тип
    const raw = config.headers as Record<string, string> | undefined;
    config.headers = {
      ...raw,
      Authorization: `Token ${token}`,
    } as InternalAxiosRequestConfig["headers"];
  }
  return config;
});