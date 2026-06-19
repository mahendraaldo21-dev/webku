import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("ll_token", res.data.token);
      localStorage.setItem("ll_username", res.data.username);
      toast.success("Login berhasil");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-8 sm:p-10 w-full max-w-md">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white mx-auto">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-semibold">Login Admin</h1>
          <p className="mt-1 text-sm text-[#4A5568]">Masuk untuk mengelola toko</p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-[#4A5568]">Username</Label>
            <div className="relative mt-2">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
              <Input
                data-testid="admin-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9 h-11 rounded-full bg-[#FAF9F6] border-[#E2E8F0]"
                placeholder="admin"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-[#4A5568]">Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
              <Input
                data-testid="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 h-11 rounded-full bg-[#FAF9F6] border-[#E2E8F0]"
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          <Button
            data-testid="admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-brand hover:bg-[#C9302C] text-white font-semibold"
          >
            {loading ? "Memuat…" : "Masuk"}
          </Button>
          <div className="text-center">
            <Link
              to="/admin/recovery"
              data-testid="forgot-password-link"
              className="text-sm text-[#4A5568] hover:text-brand"
            >
              Lupa password?
            </Link>
          </div>
          <p className="text-[11px] text-center text-[#4A5568]">
            Default: <code>admin</code> / <code>admin123</code> — segera ganti setelah login.
          </p>
        </form>
      </div>
    </div>
  );
}
