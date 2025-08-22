"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CircleUser, Loader2 } from "lucide-react";
import Link from "next/link";

export default function ProfileClient({ initialProfile, initialAddresses }) {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(initialProfile || { name: "", email: "", phone: "", image: "" });
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState(initialAddresses || []);
  const [addrForm, setAddrForm] = useState({
    _id: null,
    label: "Home",
    country: "",
    city: "",
    area: "",
    address1: "",
    address2: "",
    postalCode: "",
  });
  const [addrOpen, setAddrOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Compress an image file using a canvas. Returns a Blob.
  async function compressImage(file, { maxSize = 512, quality = 0.7, type = 'image/webp' } = {}) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });
    const { width, height } = img;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, targetW, targetH);
    const outType = type || 'image/webp';
    const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), outType, quality));
    // Fallback to image/jpeg if WEBP not supported
    if (!blob) {
      const jpegBlob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
      return jpegBlob;
    }
    return blob;
  }

  const blobToDataURL = async (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, phone: profile.phone }),
      });
      if (!res.ok) throw new Error("Failed");
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    // Always compress before upload/save
    setAvatarUploading(true);
    let compressed;
    try {
      compressed = await compressImage(file, { maxSize: 512, quality: 0.7, type: 'image/webp' });
    } catch (err) {
      // If compression fails, fallback to original file
      compressed = file;
    }
    if (!cloudName || !uploadPreset) {
      try {
        const dataUrl = await blobToDataURL(compressed);
        setProfile((p) => ({ ...p, image: dataUrl }));
        await fetch("/api/profile/avatar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: dataUrl }),
        });
      } finally {
        setAvatarUploading(false);
      }
      return;
    }
    try {
      const formData = new FormData();
      const ext = compressed.type === 'image/png' ? 'png' : (compressed.type === 'image/webp' ? 'webp' : 'jpg');
      const filename = (file.name?.split('.').slice(0, -1).join('.') || 'avatar') + '.' + ext;
      formData.append("file", compressed, filename);
      formData.append("upload_preset", uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.secure_url) throw new Error("Upload failed");
      const url = data.secure_url;
      setProfile((p) => ({ ...p, image: url }));
      await fetch("/api/profile/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  const openNewAddress = () => {
    setAddrForm({ _id: null, label: "Home", country: "", city: "", area: "", address1: "", address2: "", postalCode: "" });
    setAddrOpen(true);
  };
  const openEditAddress = (a) => {
    setAddrForm({ _id: a._id, label: a.label || "Home", country: a.country || "", city: a.city || "", area: a.area || "", address1: a.address1 || "", address2: a.address2 || "", postalCode: a.postalCode || "" });
    setAddrOpen(true);
  };
  const saveAddress = async () => {
    const payload = { ...addrForm };
    const isEdit = !!payload._id;
    const url = "/api/addresses" + (isEdit ? "" : "");
    const method = isEdit ? "PUT" : "POST";
    const body = isEdit ? { id: payload._id, label: payload.label, country: payload.country, city: payload.city, area: payload.area, address1: payload.address1, address2: payload.address2, postalCode: payload.postalCode } : payload;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) return;
    // Refresh list
    const list = await fetch("/api/addresses").then((r) => r.json());
    setAddresses(list.addresses || []);
    setAddrOpen(false);
  };
  const deleteAddress = async (id) => {
    const res = await fetch(`/api/addresses?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;
    const list = await fetch("/api/addresses").then((r) => r.json());
    setAddresses(list.addresses || []);
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === "profile" ? "default" : "outline"} onClick={() => setTab("profile")}>Profile</Button>
          <Button variant={tab === "addresses" ? "default" : "outline"} onClick={() => setTab("addresses")}>Addresses</Button>
          <Button asChild variant="outline"><Link href="/my-orders">My Orders</Link></Button>
        </div>
      </div>

      {tab === "profile" && (
        <div className="max-w-3xl mx-auto grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Update your personal information and profile photo.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="flex flex-col items-center gap-3">
                <div className="size-24 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center">
                  {profile.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.image} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <CircleUser className="size-16 text-zinc-500" />
                  )}
                </div>
                <input id="avatar" type="file" accept="image/*" onChange={onPickAvatar} className="sr-only" />
                <div className="flex items-center gap-2">
                  <Button asChild variant="outline" size="sm" disabled={avatarUploading}>
                    <label htmlFor="avatar" className="cursor-pointer">Change photo</label>
                  </Button>
                  {avatarUploading && (
                    <span className="inline-flex items-center text-sm text-zinc-500">
                      <Loader2 className="mr-1 size-4 animate-spin" /> Uploading...
                    </span>
                  )}
                </div>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile.email} disabled />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "addresses" && (
        <div className="max-w-3xl mx-auto grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved Addresses</CardTitle>
              <CardDescription>Manage delivery locations like Home and Office.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div>
                <Button onClick={openNewAddress}>Add Address</Button>
              </div>
              {addresses.length === 0 ? (
                <p className="text-gray-600">No saved addresses.</p>
              ) : (
                <ul className="space-y-3">
                  {addresses.map((a) => (
                    <li key={a._id} className="border rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                      <div>
                        <div className="font-medium">{a.label}</div>
                        <div className="text-sm text-gray-600">{a.address1}{a.address2 ? `, ${a.address2}` : ""}</div>
                        <div className="text-sm text-gray-600">{a.area ? `${a.area}, ` : ""}{a.city}</div>
                        <div className="text-sm text-gray-600">{a.country} {a.postalCode}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditAddress(a)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteAddress(a._id)}>Delete</Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {addrOpen && (
            <Card>
              <CardHeader>
                <CardTitle>{addrForm._id ? "Edit Address" : "New Address"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="label">Label</Label>
                    <Input id="label" value={addrForm.label} onChange={(e) => setAddrForm((f) => ({ ...f, label: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" value={addrForm.country} onChange={(e) => setAddrForm((f) => ({ ...f, country: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={addrForm.city} onChange={(e) => setAddrForm((f) => ({ ...f, city: e.target.value }))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="area">Area</Label>
                    <Input id="area" value={addrForm.area} onChange={(e) => setAddrForm((f) => ({ ...f, area: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input id="address1" value={addrForm.address1} onChange={(e) => setAddrForm((f) => ({ ...f, address1: e.target.value }))} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="address2">Address Line 2</Label>
                    <Input id="address2" value={addrForm.address2} onChange={(e) => setAddrForm((f) => ({ ...f, address2: e.target.value }))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input id="postalCode" value={addrForm.postalCode} onChange={(e) => setAddrForm((f) => ({ ...f, postalCode: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button onClick={saveAddress}>{addrForm._id ? "Update Address" : "Save Address"}</Button>
                  <Button variant="outline" onClick={() => setAddrOpen(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
