import React from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart, Store } from "lucide-react";
import { useCart } from "@/lib/cart";
import { STORE_INFO } from "@/lib/api";

export default function Navbar() {
  const { count } = useCart();
  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-40 bg-[#FAF9F6]/85 backdrop-blur border-b border-[#E2E8F0]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" data-testid="nav-logo" className="flex items-center gap-2 group">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white">
            <Store className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="font-heading text-lg font-bold tracking-tight">
              {STORE_INFO.name}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[#4A5568]">
              Belanja Tanpa Repot
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <NavLink to="/" data-testid="nav-home" className={({ isActive }) =>
            `transition-colors ${isActive ? "text-brand" : "text-[#1A202C] hover:text-brand"}`
          }>
            Beranda
          </NavLink>
          <NavLink to="/shop" data-testid="nav-shop" className={({ isActive }) =>
            `transition-colors ${isActive ? "text-brand" : "text-[#1A202C] hover:text-brand"}`
          }>
            Belanja
          </NavLink>
          <NavLink to="/admin/login" data-testid="nav-admin" className="text-[#4A5568] hover:text-brand">
            Admin
          </NavLink>
        </nav>

        <Link
          to="/cart"
          data-testid="nav-cart"
          className="relative inline-flex items-center gap-2 rounded-full bg-[#1A202C] text-white px-4 py-2 text-sm font-medium hover:bg-black transition-colors"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Keranjang</span>
          {count > 0 && (
            <span
              data-testid="cart-count"
              className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold px-1"
            >
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
