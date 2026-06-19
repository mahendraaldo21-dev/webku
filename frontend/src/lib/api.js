import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

// Attach token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ll_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const STORE_INFO = {
  name: "Toko Lawanglimo",
  phone_wa: "6281329856815", // International format for wa.me
  maps_link: "https://maps.app.goo.gl/ujmyhaeKVCEXRX717",
  // Generic embed - Google embed accepts any place query
  maps_embed: "https://www.google.com/maps?q=Lawanglimo&output=embed",
  tagline: "Belanja kebutuhan harian dengan mudah, langsung dari toko offline kami.",
};

export const resolveImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/api/")) return `${BACKEND_URL}${url}`;
  return url;
};

export const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n || 0);
