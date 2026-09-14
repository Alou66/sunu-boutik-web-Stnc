"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ApiError, ROLE_OWNER } from "@/lib/api";
import { updateMyProfile, updateShopProfile } from "./profil.api";

export default function ProfilPage() {
  const { user, shop, refreshMe } = useAuth();
  const isOwner = user?.role === ROLE_OWNER;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="font-semibold text-lg">Mon profil</h2>

      <PersonalInfoCard />

      {isOwner && (
        <ShopInfoCard shop={shop} onSaved={refreshMe} />
      )}
    </div>
  );
}

function PersonalInfoCard() {
  const { user, refreshMe } = useAuth();

  const [form, setForm] = useState({ full_name: "", phone: "", email: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || "",
        phone: user.phone || "",
        email: user.email || "",
      });
    }
  }, [user]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setSuccess(false);
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const full_name = form.full_name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    if (!full_name) {
      setError("Le nom complet est requis");
      return;
    }
    if (!phone) {
      setError("Le téléphone est requis");
      return;
    }
    if (!email) {
      setError("L'email est requis");
      return;
    }

    setSaving(true);
    try {
      await updateMyProfile({ full_name, phone, email });
      await refreshMe();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-medium text-gray-700 border-b pb-2 mb-4">Mes informations personnelles</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
          <input
            required
            value={form.full_name}
            onChange={update("full_name")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              required
              value={form.phone}
              onChange={update("phone")}
              placeholder="77 XXX XX XX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={update("email")}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-400">Sert aussi d&apos;identifiant de connexion.</p>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Informations mises à jour avec succès.</p>}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function ShopInfoCard({
  shop,
  onSaved,
}: {
  shop: { name: string; address?: string | null; phone?: string | null; phone2?: string | null; phone3?: string | null; ninea?: string | null; rc?: string | null } | null;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: "", address: "", phone: "", phone2: "", phone3: "", ninea: "", rc: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || "",
        address: shop.address || "",
        phone: shop.phone || "",
        phone2: shop.phone2 || "",
        phone3: shop.phone3 || "",
        ninea: shop.ninea || "",
        rc: shop.rc || "",
      });
    }
  }, [shop]);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setSuccess(false);
    };
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false); setSaving(true);
    try {
      await updateShopProfile({
        name: form.name.trim() || undefined,
        address: form.address.trim() || undefined,
        phone: form.phone.trim() || undefined,
        phone2: form.phone2.trim() || undefined,
        phone3: form.phone3.trim() || undefined,
        ninea: form.ninea.trim() || undefined,
        rc: form.rc.trim() || undefined,
      });
      await onSaved();
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h3 className="font-medium text-gray-700 border-b pb-2 mb-4">Informations de la boutique</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique</label>
          <input
            required
            value={form.name}
            onChange={update("name")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            value={form.address}
            onChange={update("address")}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 1</label>
            <input value={form.phone} onChange={update("phone")} placeholder="77 XXX XX XX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 2</label>
            <input value={form.phone2} onChange={update("phone2")} placeholder="78 XXX XX XX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone 3</label>
            <input value={form.phone3} onChange={update("phone3")} placeholder="76 XXX XX XX"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NINEA</label>
            <input value={form.ninea} onChange={update("ninea")} placeholder="005550539"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RC</label>
            <input value={form.rc} onChange={update("rc")} placeholder="SN-DKR-2015.A.11862"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">Boutique mise à jour avec succès.</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white rounded-md px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>
    </div>
  );
}
