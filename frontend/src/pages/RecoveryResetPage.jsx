import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Lock } from "lucide-react";
import { toast } from "sonner";

export default function RecoveryResetPage() {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirm) {
      toast.error("Konfirmasi password tidak cocok");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/auth/reset-with-recovery", {
        recovery_key: recoveryKey.trim().toUpperCase(),
        new_password: newPassword,
      });
      localStorage.setItem("ll_token", res.data.token);
      localStorage.setItem("ll_username", res.data.username);
      toast.success("Password berhasil di-reset. Anda sudah login.");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="recovery-reset-page" className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-8 sm:p-10 w-full max-w-md">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white mx-auto">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-4 font-heading text-2xl font-semibold">Reset Password</h1>
          <p className="mt-1 text-sm text-[#4A5568]">
            Masukkan kode pemulihan untuk membuat password baru.
          </p>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-[#4A5568]">Kode Pemulihan</Label>
            <Input
              data-testid="recovery-key-input"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="mt-2 h-11 font-mono tracking-wider bg-[#FAF9F6] border-[#E2E8F0]"
              required
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-[#4A5568]">Password Baru</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
              <Input
                data-testid="recovery-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pl-9 h-11 rounded-full bg-[#FAF9F6] border-[#E2E8F0]"
                placeholder="Min. 6 karakter"
                required
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-[#4A5568]">Konfirmasi Password</Label>
            <div className="relative mt-2">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
              <Input
                data-testid="recovery-confirm-password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="pl-9 h-11 rounded-full bg-[#FAF9F6] border-[#E2E8F0]"
                required
              />
            </div>
          </div>
          <Button
            data-testid="recovery-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-full bg-brand hover:bg-[#C9302C] text-white font-semibold"
          >
            {loading ? "Memproses…" : "Reset Password"}
          </Button>
          <div className="text-center text-sm">
            <Link to="/admin/login" data-testid="back-to-login" className="text-[#4A5568] hover:text-brand">
              ← Kembali ke login
            </Link>
          </div>
          <p className="text-[11px] text-center text-[#4A5568]">
            Kode pemulihan hanya berlaku <strong>sekali</strong>. Setelah reset, buat kode baru di tab Akun.
          </p>
        </form>
      </div>
    </div>
  );
}
