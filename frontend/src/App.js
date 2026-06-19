import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/lib/cart";

import HomePage from "@/pages/HomePage";
import ShopPage from "@/pages/ShopPage";
import CartPage from "@/pages/CartPage";
import AdminLoginPage from "@/pages/AdminLoginPage";
import AdminPage from "@/pages/AdminPage";
import RecoveryResetPage from "@/pages/RecoveryResetPage";

function App() {
  return (
    <div className="App">
      <CartProvider>
        <BrowserRouter>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin/recovery" element={<RecoveryResetPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </CartProvider>
    </div>
  );
}

export default App;
