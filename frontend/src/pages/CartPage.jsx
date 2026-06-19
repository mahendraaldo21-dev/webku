import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/lib/cart";
import { api, formatRupiah, resolveImageUrl, STORE_INFO } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2, MessageCircle, BadgePercent, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null); // {code, discount_percent, product_id}
  const [checking, setChecking] = useState(false);

  const applicableItem = appliedDiscount
    ? items.find((i) => i.id === appliedDiscount.product_id)
    : null;
  const discountAmount = applicableItem
    ? (applicableItem.price * applicableItem.qty * (appliedDiscount.discount_percent || 0)) / 100
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setChecking(true);
    try {
      const res = await api.post("/discounts/validate", { code: discountCode.trim() });
      if (!items.find((i) => i.id === res.data.product_id)) {
        toast.error(`Kode hanya berlaku untuk ${res.data.product_name}. Tambahkan barangnya dulu.`);
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(res.data);
        toast.success(`Diskon ${res.data.discount_percent}% diterapkan untuk ${res.data.product_name}`);
      }
    } catch (e) {
      toast.error(e.response?.data?.detail || "Kode diskon tidak valid");
      setAppliedDiscount(null);
    } finally {
      setChecking(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
  };

  const buildWaMessage = () => {
    let msg = `Halo ${STORE_INFO.name}! Saya ingin memesan:\n\n`;
    items.forEach((it, i) => {
      msg += `${i + 1}. ${it.name} x${it.qty} — ${formatRupiah(it.price * it.qty)}\n`;
    });
    msg += `\nSubtotal: ${formatRupiah(subtotal)}`;
    if (appliedDiscount && applicableItem) {
      msg += `\nKode Diskon: ${appliedDiscount.code} (${appliedDiscount.discount_percent}% untuk ${applicableItem.name})`;
      msg += `\nPotongan: -${formatRupiah(discountAmount)}`;
    }
    msg += `\nTotal: ${formatRupiah(total)}\n\nMohon info ketersediaan & pengirimannya, terima kasih!`;
    return msg;
  };

  const checkout = () => {
    if (items.length === 0) return;
    const url = `https://wa.me/${STORE_INFO.phone_wa}?text=${encodeURIComponent(buildWaMessage())}`;
    window.open(url, "_blank");
  };

  if (items.length === 0) {
    return (
      <div data-testid="cart-page" className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-[#4A5568]/50" />
        <h2 className="font-heading text-3xl font-semibold mt-4">Keranjang masih kosong</h2>
        <p className="mt-2 text-[#4A5568]">Yuk pilih barang dulu sebelum checkout.</p>
        <Link to="/shop">
          <Button data-testid="empty-cart-shop-btn" className="mt-6 rounded-full bg-brand hover:bg-[#C9302C] text-white">
            Mulai Belanja
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="cart-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight">Keranjang Belanja</h1>

      <div className="mt-8 grid lg:grid-cols-[1.5fr_1fr] gap-8 items-start">
        {/* Items */}
        <div className="space-y-3">
          {items.map((it) => (
            <div
              key={it.id}
              data-testid={`cart-item-${it.id}`}
              className="bg-white rounded-2xl border border-[#E2E8F0] soft-shadow p-4 flex gap-4"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#F3F1EC] flex-shrink-0">
                {it.image_url ? (
                  <img src={resolveImageUrl(it.image_url)} alt={it.name} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1A202C] line-clamp-1">{it.name}</h3>
                <div className="mt-1 font-heading font-bold">{formatRupiah(it.price)}</div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    data-testid={`qty-dec-${it.id}`}
                    onClick={() => updateQty(it.id, it.qty - 1)}
                    className="h-8 w-8 rounded-full border border-[#E2E8F0] inline-flex items-center justify-center hover:border-[#1A202C]"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span data-testid={`qty-${it.id}`} className="w-8 text-center font-medium">{it.qty}</span>
                  <button
                    data-testid={`qty-inc-${it.id}`}
                    onClick={() => updateQty(it.id, it.qty + 1)}
                    className="h-8 w-8 rounded-full border border-[#E2E8F0] inline-flex items-center justify-center hover:border-[#1A202C]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    data-testid={`remove-item-${it.id}`}
                    onClick={() => removeItem(it.id)}
                    className="ml-auto text-[#4A5568] hover:text-brand inline-flex items-center gap-1 text-sm"
                  >
                    <Trash2 className="h-4 w-4" /> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}

          <button
            data-testid="clear-cart-btn"
            onClick={clearCart}
            className="mt-2 text-sm text-[#4A5568] hover:text-brand"
          >
            Kosongkan keranjang
          </button>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-6 sticky top-24">
          <h2 className="font-heading text-xl font-semibold">Ringkasan</h2>

          <div className="mt-5">
            <label className="text-xs uppercase tracking-widest text-[#4A5568] flex items-center gap-1.5">
              <BadgePercent className="h-3.5 w-3.5" />
              Kode Diskon
            </label>
            <div className="mt-2 flex gap-2">
              <Input
                data-testid="discount-input"
                placeholder="Masukkan kode"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="rounded-full bg-[#FAF9F6] border-[#E2E8F0]"
                disabled={!!appliedDiscount}
              />
              {appliedDiscount ? (
                <Button
                  data-testid="remove-discount-btn"
                  onClick={removeDiscount}
                  variant="outline"
                  className="rounded-full"
                >
                  Hapus
                </Button>
              ) : (
                <Button
                  data-testid="apply-discount-btn"
                  onClick={applyDiscount}
                  disabled={checking}
                  className="rounded-full bg-[#1A202C] hover:bg-black text-white"
                >
                  {checking ? "Cek…" : "Pakai"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#4A5568]">Subtotal</span>
              <span data-testid="summary-subtotal" className="font-medium">{formatRupiah(subtotal)}</span>
            </div>
            {appliedDiscount && applicableItem && (
              <div className="flex justify-between text-brand">
                <span>Diskon ({appliedDiscount.code})</span>
                <span data-testid="summary-discount">-{formatRupiah(discountAmount)}</span>
              </div>
            )}
            <div className="border-t border-[#E2E8F0] pt-3 flex justify-between text-base">
              <span className="font-heading font-semibold">Total</span>
              <span data-testid="summary-total" className="font-heading font-bold text-lg">{formatRupiah(total)}</span>
            </div>
          </div>

          <Button
            data-testid="checkout-wa-btn"
            onClick={checkout}
            className="mt-6 w-full h-12 rounded-full bg-wa hover:bg-[#1FAE56] text-white font-semibold text-base"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Checkout via WhatsApp
          </Button>
          <p className="mt-3 text-[11px] text-[#4A5568] text-center">
            Pesananmu akan dikirim ke admin via WhatsApp untuk konfirmasi.
          </p>
        </div>
      </div>
    </div>
  );
}
