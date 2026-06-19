import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatRupiah, resolveImageUrl } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Tag, Zap } from "lucide-react";
import { toast } from "sonner";

export default function ShopPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCat, setActiveCat] = useState("");
  const [query, setQuery] = useState("");
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data || [])).catch(() => {});
    api.get("/categories").then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (activeCat && p.category !== activeCat) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [products, activeCat, query]);

  const handleAdd = (p) => {
    addItem(p, 1);
    toast.success(`${p.name} ditambahkan ke keranjang`);
  };

  const handleBuyNow = (p) => {
    addItem(p, 1);
    navigate("/cart");
  };

  return (
    <div data-testid="shop-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#4A5568]">Katalog</div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
            Pilih barang kesukaanmu
          </h1>
        </div>
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
          <Input
            data-testid="search-input"
            placeholder="Cari barang…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 rounded-full bg-white border-[#E2E8F0] h-11"
          />
        </div>
      </div>

      {/* Filters */}
      <div data-testid="category-filter" className="mt-6 flex flex-wrap gap-2">
        <button
          data-testid="filter-all"
          onClick={() => setActiveCat("")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !activeCat
              ? "bg-[#1A202C] text-white border-[#1A202C]"
              : "bg-white text-[#1A202C] border-[#E2E8F0] hover:border-[#1A202C]"
          }`}
        >
          Semua
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            data-testid={`filter-${c.name}`}
            onClick={() => setActiveCat(c.name)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeCat === c.name
                ? "bg-[#1A202C] text-white border-[#1A202C]"
                : "bg-white text-[#1A202C] border-[#E2E8F0] hover:border-[#1A202C]"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          data-testid="empty-state"
          className="mt-16 rounded-3xl border border-dashed border-[#E2E8F0] py-20 text-center text-[#4A5568]"
        >
          <p className="font-medium">Belum ada barang yang cocok.</p>
          <p className="text-sm mt-1">Coba ubah filter atau kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={() => handleAdd(p)}
              onBuy={() => handleBuyNow(p)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product, onAdd, onBuy }) {
  const hasDiscount = product.discount_percent && product.discount_percent > 0;
  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group bg-white rounded-2xl border border-[#E2E8F0] soft-shadow hover-shadow transition-shadow overflow-hidden flex flex-col"
    >
      <div className="relative aspect-square bg-[#F3F1EC] overflow-hidden">
        {product.image_url ? (
          <img
            src={resolveImageUrl(product.image_url)}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#4A5568]/40 text-xs">
            Tanpa Gambar
          </div>
        )}
        {hasDiscount && (
          <span
            data-testid={`discount-badge-${product.id}`}
            className="absolute top-3 left-3 inline-flex items-center gap-1 bg-discount text-white text-[11px] font-bold px-2.5 py-1 rounded-full"
          >
            <Tag className="h-3 w-3" />
            Diskon {product.discount_percent}%
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-widest text-[#4A5568]">
          {product.category || "Lain-lain"}
        </div>
        <h3 className="mt-1 font-heading text-base font-semibold leading-snug line-clamp-2 text-[#1A202C]">
          {product.name}
        </h3>
        <p className="mt-1 text-xs text-[#4A5568] line-clamp-2">
          {product.description}
        </p>
        <div className="mt-3 font-heading text-lg font-bold text-[#1A202C]">
          {formatRupiah(product.price)}
        </div>
        <div className="mt-auto pt-3 flex gap-2">
          <Button
            data-testid={`add-cart-btn-${product.id}`}
            onClick={onAdd}
            variant="outline"
            size="sm"
            className="rounded-full flex-1 border-[#E2E8F0] hover:border-[#1A202C]"
          >
            <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Keranjang
          </Button>
          <Button
            data-testid={`buy-now-btn-${product.id}`}
            onClick={onBuy}
            size="sm"
            className="rounded-full flex-1 bg-brand hover:bg-[#C9302C] text-white"
          >
            <Zap className="h-3.5 w-3.5 mr-1" /> Beli
          </Button>
        </div>
      </div>
    </div>
  );
}
