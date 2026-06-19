import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, formatRupiah, resolveImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, LogOut, Upload, ImageIcon, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function AdminPage() {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("ll_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    api.get("/auth/me")
      .then((r) => { setUsername(r.data.username); setAuthed(true); })
      .catch(() => {
        localStorage.removeItem("ll_token");
        navigate("/admin/login");
      });
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("ll_token");
    localStorage.removeItem("ll_username");
    navigate("/admin/login");
  };

  if (!authed) return null;

  return (
    <div data-testid="admin-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-[#4A5568] inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
            Panel Admin
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight mt-1">
            Halo, {username}
          </h1>
        </div>
        <Button
          data-testid="admin-logout-btn"
          variant="outline"
          onClick={logout}
          className="rounded-full"
        >
          <LogOut className="h-4 w-4 mr-2" /> Keluar
        </Button>
      </div>

      <Tabs defaultValue="products" className="mt-8">
        <TabsList className="bg-[#F3F1EC] rounded-full p-1">
          <TabsTrigger data-testid="tab-products" value="products" className="rounded-full">Produk</TabsTrigger>
          <TabsTrigger data-testid="tab-categories" value="categories" className="rounded-full">Kategori</TabsTrigger>
          <TabsTrigger data-testid="tab-slides" value="slides" className="rounded-full">Slider</TabsTrigger>
          <TabsTrigger data-testid="tab-settings" value="settings" className="rounded-full">Akun</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="mt-6"><ProductsTab /></TabsContent>
        <TabsContent value="categories" className="mt-6"><CategoriesTab /></TabsContent>
        <TabsContent value="slides" className="mt-6"><SlidesTab /></TabsContent>
        <TabsContent value="settings" className="mt-6"><AccountTab onUsernameChange={setUsername} /></TabsContent>
      </Tabs>
    </div>
  );
}

// ===== Products Tab =====
function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get("/admin/products").then((r) => setProducts(r.data || []));
    api.get("/categories").then((r) => setCategories(r.data || []));
  };
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Hapus produk ini?")) return;
    await api.delete(`/products/${id}`);
    toast.success("Produk dihapus");
    load();
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-semibold">Daftar Produk</h2>
        <Dialog open={openForm} onOpenChange={(o) => { setOpenForm(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-product-btn" className="rounded-full bg-brand hover:bg-[#C9302C] text-white">
              <Plus className="h-4 w-4 mr-1" /> Tambah Produk
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Produk" : "Tambah Produk"}</DialogTitle>
            </DialogHeader>
            <ProductForm
              initial={editing}
              categories={categories}
              onDone={() => { setOpenForm(false); setEditing(null); load(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-5 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gambar</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Stok</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-[#4A5568]">Belum ada produk.</TableCell></TableRow>
            )}
            {products.map((p) => (
              <TableRow key={p.id} data-testid={`admin-product-row-${p.id}`}>
                <TableCell>
                  <div className="w-12 h-12 rounded-lg bg-[#F3F1EC] overflow-hidden">
                    {p.image_url ? <img src={resolveImageUrl(p.image_url)} alt={p.name} className="w-full h-full object-cover" /> : null}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.category || "-"}</TableCell>
                <TableCell>{formatRupiah(p.price)}</TableCell>
                <TableCell>{p.stock ?? 0}</TableCell>
                <TableCell>
                  {p.discount_code ? (
                    <span className="text-xs"><code>{p.discount_code}</code> · {p.discount_percent}%</span>
                  ) : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    data-testid={`edit-product-${p.id}`}
                    size="sm" variant="ghost"
                    onClick={() => { setEditing(p); setOpenForm(true); }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    data-testid={`delete-product-${p.id}`}
                    size="sm" variant="ghost"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4 text-brand" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ProductForm({ initial, categories, onDone }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    price: initial?.price || 0,
    category: initial?.category || "",
    image_url: initial?.image_url || "",
    discount_code: initial?.discount_code || "",
    discount_percent: initial?.discount_percent || 0,
    stock: initial?.stock ?? 0,
  });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const change = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      change("image_url", res.data.url);
      toast.success("Gambar berhasil diunggah");
    } catch (err) {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      stock: parseInt(form.stock, 10) || 0,
      discount_percent: form.discount_percent ? parseFloat(form.discount_percent) : null,
      discount_code: form.discount_code?.trim() || null,
    };
    try {
      if (initial?.id) {
        await api.put(`/products/${initial.id}`, payload);
        toast.success("Produk diperbarui");
      } else {
        await api.post("/products", payload);
        toast.success("Produk ditambahkan");
      }
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menyimpan");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nama Barang</Label>
          <Input data-testid="form-product-name" value={form.name} onChange={(e) => change("name", e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label>Harga (Rp)</Label>
          <Input data-testid="form-product-price" type="number" min="0" value={form.price} onChange={(e) => change("price", e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label>Stok</Label>
          <Input data-testid="form-product-stock" type="number" min="0" value={form.stock} onChange={(e) => change("stock", e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Kategori</Label>
          <Select value={form.category || "__none__"} onValueChange={(v) => change("category", v === "__none__" ? "" : v)}>
            <SelectTrigger data-testid="form-product-category" className="mt-1">
              <SelectValue placeholder="Pilih kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— Tanpa Kategori —</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Deskripsi</Label>
          <Textarea data-testid="form-product-description" rows={3} value={form.description} onChange={(e) => change("description", e.target.value)} className="mt-1" />
        </div>
        <div className="col-span-2">
          <Label>Gambar Produk</Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="w-20 h-20 rounded-lg bg-[#F3F1EC] overflow-hidden flex items-center justify-center">
              {form.image_url ? (
                <img src={resolveImageUrl(form.image_url)} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6 text-[#4A5568]/50" />
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" data-testid="form-product-image-input" />
            <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="rounded-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Mengunggah…" : "Unggah Gambar"}
            </Button>
          </div>
        </div>
        <div className="col-span-2 border-t pt-4">
          <div className="text-xs uppercase tracking-widest text-[#4A5568]">Fitur Diskon (Opsional)</div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <Label>Kode Diskon</Label>
              <Input data-testid="form-product-discount-code" placeholder="contoh: HEMAT10" value={form.discount_code} onChange={(e) => change("discount_code", e.target.value.toUpperCase())} className="mt-1" />
            </div>
            <div>
              <Label>Persen Diskon (%)</Label>
              <Input data-testid="form-product-discount-percent" type="number" min="0" max="100" value={form.discount_percent} onChange={(e) => change("discount_percent", e.target.value)} className="mt-1" />
            </div>
          </div>
          <p className="mt-1 text-[11px] text-[#4A5568]">Pembeli memasukkan kode di keranjang untuk dapat diskon barang ini.</p>
        </div>
      </div>
      <DialogFooter>
        <Button data-testid="form-product-submit" type="submit" className="rounded-full bg-brand hover:bg-[#C9302C] text-white">
          {initial ? "Simpan Perubahan" : "Tambah Produk"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ===== Categories Tab =====
function CategoriesTab() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState("");

  const load = () => api.get("/categories").then((r) => setCats(r.data || []));
  useEffect(() => { load(); }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api.post("/categories", { name: name.trim() });
      setName("");
      load();
      toast.success("Kategori ditambahkan");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal");
    }
  };

  const remove = async (id) => {
    await api.delete(`/categories/${id}`);
    load();
    toast.success("Kategori dihapus");
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-6 max-w-2xl">
      <h2 className="font-heading text-xl font-semibold">Kategori Barang</h2>
      <form onSubmit={add} className="mt-4 flex gap-2">
        <Input data-testid="category-input" placeholder="Nama kategori baru" value={name} onChange={(e) => setName(e.target.value)} className="rounded-full bg-[#FAF9F6] border-[#E2E8F0]" />
        <Button data-testid="add-category-btn" type="submit" className="rounded-full bg-brand hover:bg-[#C9302C] text-white">
          <Plus className="h-4 w-4 mr-1" /> Tambah
        </Button>
      </form>
      <ul className="mt-6 space-y-2">
        {cats.length === 0 && <li className="text-sm text-[#4A5568]">Belum ada kategori.</li>}
        {cats.map((c) => (
          <li key={c.id} data-testid={`category-${c.id}`} className="flex items-center justify-between bg-[#FAF9F6] rounded-full px-4 py-2">
            <span className="text-sm font-medium">{c.name}</span>
            <button onClick={() => remove(c.id)} data-testid={`delete-category-${c.id}`} className="text-[#4A5568] hover:text-brand">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ===== Slides Tab =====
function SlidesTab() {
  const [images, setImages] = useState(["", "", ""]);
  const [uploading, setUploading] = useState(null);
  const refs = [useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    api.get("/slides").then((r) => {
      const imgs = r.data.images || [];
      while (imgs.length < 3) imgs.push("");
      setImages(imgs.slice(0, 3));
    });
  }, []);

  const onUpload = async (idx, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(idx);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const next = [...images];
      next[idx] = res.data.url;
      setImages(next);
      toast.success(`Slide ${idx + 1} berhasil diunggah`);
    } catch {
      toast.error("Gagal mengunggah");
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    try {
      await api.put("/slides", { images });
      toast.success("Slider tersimpan");
    } catch {
      toast.error("Gagal menyimpan");
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-6">
      <h2 className="font-heading text-xl font-semibold">Foto Slider Beranda</h2>
      <p className="text-sm text-[#4A5568] mt-1">Unggah 3 foto toko offline. Akan berganti otomatis di beranda.</p>
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {images.map((img, i) => (
          <div key={i} data-testid={`slide-slot-${i}`} className="rounded-2xl border border-[#E2E8F0] overflow-hidden bg-[#FAF9F6]">
            <div className="aspect-video bg-[#F3F1EC] flex items-center justify-center">
              {img ? (
                <img src={resolveImageUrl(img)} alt={`slide ${i + 1}`} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-8 w-8 text-[#4A5568]/40" />
              )}
            </div>
            <div className="p-3">
              <input ref={refs[i]} type="file" accept="image/*" hidden onChange={(e) => onUpload(i, e)} data-testid={`slide-upload-input-${i}`} />
              <Button
                data-testid={`slide-upload-${i}`}
                onClick={() => refs[i].current?.click()}
                variant="outline"
                size="sm"
                disabled={uploading === i}
                className="w-full rounded-full"
              >
                <Upload className="h-3.5 w-3.5 mr-1" />
                {uploading === i ? "Mengunggah…" : `Ganti Slide ${i + 1}`}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end">
        <Button data-testid="save-slides-btn" onClick={save} className="rounded-full bg-brand hover:bg-[#C9302C] text-white">
          Simpan Slider
        </Button>
      </div>
    </div>
  );
}

// ===== Account Tab =====
function AccountTab({ onUsernameChange }) {
  const [form, setForm] = useState({ current_password: "", new_username: "", new_password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/change-credentials", form);
      localStorage.setItem("ll_token", res.data.token);
      localStorage.setItem("ll_username", res.data.username);
      onUsernameChange(res.data.username);
      toast.success("Kredensial berhasil diperbarui");
      setForm({ current_password: "", new_username: "", new_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal memperbarui");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-6 max-w-xl">
      <h2 className="font-heading text-xl font-semibold">Ganti Username / Password</h2>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <Label>Password Saat Ini</Label>
          <Input data-testid="acc-current-password" type="password" required value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Username Baru (opsional)</Label>
          <Input data-testid="acc-new-username" value={form.new_username} onChange={(e) => setForm({ ...form, new_username: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label>Password Baru (opsional)</Label>
          <Input data-testid="acc-new-password" type="password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} className="mt-1" />
        </div>
        <Button data-testid="acc-submit" type="submit" disabled={loading} className="rounded-full bg-brand hover:bg-[#C9302C] text-white">
          {loading ? "Menyimpan…" : "Simpan Perubahan"}
        </Button>
      </form>
    </div>
  );
}
