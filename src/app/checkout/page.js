"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { formatBDT } from "@/lib/currency";
import { Check, ChevronRight, ChevronDown, User, MapPin, Truck, Wallet, CreditCard as CreditCardIcon, ClipboardCheck, BadgePercent } from "lucide-react";

// Lightweight area suggestions for popular cities (optional, non-blocking)
const SUGGESTED_AREAS = {
  dhaka: ["Gulshan", "Banani", "Dhanmondi", "Mirpur", "Uttara"],
  chattogram: ["Agrabad", "Nasirabad", "Chawkbazar", "Pahartali"],
  sylhet: ["Zindabazar", "Subid Bazar", "Ambarkhana"],
};

const KNOWN_PROMOS = {
  ROBO10: { type: "percent", value: 10, label: "10% OFF" },
  ROBO20: { type: "percent", value: 20, label: "20% OFF" },
  // Use shared formatter so the symbol and spacing are always consistent
  SAVE50: { type: "flat", value: 50, label: `${formatBDT(50)} OFF` },
};

export default function CheckoutPage() {
  const { items, subtotal, updateQty, removeItem, clear, setCartFromServer, updatedAt } = useCart();
  const router = useRouter();
  const { data: session } = useSession();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState(null);
  const [message, setMessage] = useState(null);
  // Removed saved-address dropdown per feedback; still prefill best address silently
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const s = Number(localStorage.getItem('checkoutStep'));
    return Number.isFinite(s) && s >= 0 && s <= 3 ? s : 0;
  }); // 0: Contact, 1: Address, 2: Delivery & Payment, 3: Review
  const [showAddressMore, setShowAddressMore] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('checkoutShowAddressMore') === '1';
  });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [syncingCart, setSyncingCart] = useState(false);

  // suggestedAreas depends on form.city, compute after form is initialized

  // Refs for smooth scroll to active step
  const refContact = useRef(null);
  const refAddress = useRef(null);
  const refPayment = useRef(null);
  const refReview = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('checkoutStep', String(step));
    const target = step === 0 ? refContact.current : step === 1 ? refAddress.current : step === 2 ? refPayment.current : refReview.current;
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('checkoutShowAddressMore', showAddressMore ? '1' : '0');
  }, [showAddressMore]);

  // Address and contact fields
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Bangladesh",
    city: "",
    area: "",
    address1: "",
    postalCode: "",
    notes: "",
  deliveryWindow: "",
    billingSameAsShipping: true,
    billingCountry: "Bangladesh",
    billingCity: "",
    billingArea: "",
    billingAddress1: "",
    billingPostalCode: "",
  shippingMethod: "standard", // pickup | standard | express
  saveAddress: false,
  addressLabel: "Home",
  agreeToTerms: false,
    paymentMethod: "cod", // cod | bkash | card
    bkashNumber: "",
    bkashTxnId: "",
    cardNumber: "",
    cardExpiry: "",
  cardCvc: "",
  codFeeEnabled: false,
  });

  const suggestedAreas = useMemo(() => {
    return SUGGESTED_AREAS[(form.city || '').toLowerCase()] || [];
  }, [form.city]);

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    const promo = KNOWN_PROMOS[appliedPromo];
    if (!promo) return 0;
    if (promo.type === "percent") return Math.min(subtotal * (promo.value / 100), subtotal);
    if (promo.type === "flat") return Math.min(promo.value, subtotal);
    return 0;
  }, [appliedPromo, subtotal]);

  const shipping = useMemo(() => {
    // Simple rules: pickup=0; standard=60 (free over 1000); express=120
    if (form.shippingMethod === "pickup") return 0;
    if (form.shippingMethod === "express") return 120;
    // standard
    return subtotal >= 1000 ? 0 : 60;
  }, [form.shippingMethod, subtotal]);
  const codFee = form.codFeeEnabled && form.paymentMethod === 'cod' ? 20 : 0;
  const total = Math.max(0, subtotal - discount + shipping + codFee);
  const deliveryEstimate = useMemo(() => {
    const base = new Date();
    const days = form.shippingMethod === 'express' ? 1 : form.shippingMethod === 'pickup' ? 0 : 3;
    const eta = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    return form.shippingMethod === 'pickup' ? 'Ready for pickup today' : `Estimated delivery ${eta.toLocaleDateString()}`;
  }, [form.shippingMethod]);

  // Prefill from profile and saved addresses
  useEffect(() => {
    let cancelled = false;
    async function prefill() {
      try {
        // Prefill name/email from session immediately
        if (session?.user) {
          setForm((f) => ({
            ...f,
            fullName: f.fullName || session.user.name || "",
            email: f.email || session.user.email || "",
          }));
        }
        // Fetch profile for phone/name overrides
        setLoadingProfile(true);
        const profRes = await fetch("/api/profile", { cache: "no-store" });
        if (profRes.ok) {
          const { profile } = await profRes.json();
          if (!cancelled && profile) {
            setForm((f) => ({
              ...f,
              fullName: f.fullName || profile.name || "",
              email: f.email || profile.email || "",
              phone: f.phone || profile.phone || "",
            }));
          }
        }
        if (!cancelled) setLoadingProfile(false);
        // Fetch addresses and pick Home -> first
        setLoadingAddresses(true);
        const addrRes = await fetch("/api/addresses", { cache: "no-store" });
        if (addrRes.ok) {
          const { addresses = [] } = await addrRes.json();
          const preferred = addresses.find((a) => (a.label || "").toLowerCase() === "home") || addresses[0];
          if (!cancelled && preferred) {
            setForm((f) => ({
              ...f,
              country: f.country || preferred.country || f.country,
              city: f.city || preferred.city || "",
              area: f.area || preferred.area || "",
              address1: f.address1 || preferred.address1 || "",
              postalCode: f.postalCode || preferred.postalCode || "",
              // keep billing as same by default
            }));
          }
        }
        if (!cancelled) setLoadingAddresses(false);
      } catch (_) {
        // ignore prefill failures
        if (!cancelled) {
          setLoadingProfile(false);
          setLoadingAddresses(false);
        }
      }
    }
    prefill();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  // Sync cart from DB on load when authenticated with change + timestamp checks
  useEffect(() => {
    let cancelled = false;
    async function syncCart() {
      if (!session?.user) return;
      try {
  setSyncingCart(true);
  const res = await fetch('/api/cart', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const serverItems = data?.cart?.items || [];
        const serverTsRaw = data?.cart?.updatedAt;
        const serverTs = typeof serverTsRaw === 'string' ? Date.parse(serverTsRaw) : Number(serverTsRaw || 0);

        // Helper: compare by id+qty ignoring order
        const byIdQty = (arr) => {
          const m = new Map();
          for (const it of Array.isArray(arr) ? arr : []) {
            if (!it?.id) continue;
            const qty = Math.max(1, Number(it.qty || 1));
            m.set(String(it.id), qty + (m.get(String(it.id)) || 0));
          }
          return m;
        };
        const a = byIdQty(items);
        const b = byIdQty(serverItems);
        let changed = false;
        if (a.size !== b.size) changed = true;
        if (!changed) {
          for (const [k, v] of a.entries()) {
            if (b.get(k) !== v) { changed = true; break; }
          }
        }
        if (!changed) return; // data same, no update

        const localTs = Number(updatedAt || 0);
        if (!serverTs || (localTs && localTs > serverTs)) {
          // Local is newer: push local to server
          try {
            await fetch('/api/cart', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ items, subtotal })
            });
          } catch {}
        } else {
          // Server is newer: adopt server snapshot
          setCartFromServer(serverItems, serverTsRaw);
        }
      } catch {} finally {
        if (!cancelled) setSyncingCart(false);
      }
    }
    syncCart();
    return () => { cancelled = true; };
  }, [session?.user, items, subtotal, updatedAt, setCartFromServer]);

  const applyPromo = async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    setPromoMessage(null);
    try {
      const res = await fetch(`/api/public/validate-coupon?code=${encodeURIComponent(code)}&subtotal=${subtotal}`);
      if (!res.ok) throw new Error('Invalid');
      const data = await res.json();
      // data: { valid, type: 'percent'|'flat', value, label }
      if (!data?.valid) throw new Error('Invalid');
      KNOWN_PROMOS[code] = { type: data.type, value: Number(data.value||0), label: data.label || `${code} applied` };
  setAppliedPromo(code);
  setPromoMessage({ type: 'success', text: `Applied ${KNOWN_PROMOS[code].label}` });
  toast.success(`Coupon applied: ${KNOWN_PROMOS[code].label}`);
    } catch {
  setAppliedPromo(null);
  setPromoMessage({ type: 'error', text: 'Invalid promo code.' });
  toast.error('Invalid promo code');
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    let v = type === 'checkbox' ? checked : value;
    // Light formatting for card inputs
    if (name === 'cardNumber') {
      const digits = String(v).replace(/\D+/g, '').slice(0, 19);
      v = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
    if (name === 'cardExpiry') {
      const digits = String(v).replace(/\D+/g, '').slice(0, 4);
      v = digits.length > 2 ? `${digits.slice(0,2)}/${digits.slice(2)}` : digits;
    }
    if (name === 'cardCvc') {
      v = String(v).replace(/\D+/g, '').slice(0, 4);
    }
    setForm((f) => {
      const next = { ...f, [name]: v };
      // Auto-advance when delivery window chosen and current address is valid
      if (name === 'deliveryWindow' && step === 1 && next.deliveryWindow) {
        const errs = validateAddressForm(next);
        if (Object.keys(errs).length === 0) {
          setStep(2);
        }
      }
      return next;
    });
    // Clear error for the field being edited
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
    // If switching payment method, clear method-specific errors
    if (name === "paymentMethod") {
      setErrors((prev) => ({
        ...prev,
        bkashNumber: undefined,
        bkashTxnId: undefined,
        cardNumber: undefined,
        cardExpiry: undefined,
        cardCvc: undefined,
      }));
    }
  };

  const validate = () => {
    const errs = {};
    // Cart
    if (items.length === 0) {
      errs.cart = "Your cart is empty.";
    }
    // Contact
    if (!form.fullName || form.fullName.trim().length < 3) {
      errs.fullName = "Please enter your full name (min 3 characters).";
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!/^\+?[0-9\-\s]{7,15}$/.test(form.phone)) {
      errs.phone = "Please enter a valid phone number.";
    }
    // Shipping
    if (!form.city) {
      errs.city = "City is required.";
    }
    if (!form.address1) {
      errs.address1 = "Address line 1 is required.";
    }
  // Area optional to reduce friction
    if (!form.deliveryWindow) {
      errs.deliveryWindow = "Please choose a delivery window.";
    }
    // Billing (if different)
    if (!form.billingSameAsShipping) {
      if (!form.billingCity) {
        errs.billingCity = "Billing city is required.";
      }
      if (!form.billingAddress1) {
        errs.billingAddress1 = "Billing address line 1 is required.";
      }
    }
    // Payment specifics
    if (form.paymentMethod === "bkash") {
      if (!/^01[0-9]{9}$/.test(form.bkashNumber)) {
        errs.bkashNumber = "Enter a valid bKash number (11 digits starting with 01).";
      }
      if (!form.bkashTxnId || form.bkashTxnId.trim().length < 6) {
        errs.bkashTxnId = "Enter a valid bKash transaction ID.";
      }
    }
    if (form.paymentMethod === "card") {
      const digits = (form.cardNumber || "").replace(/\s+/g, "");
      if (!/^\d{12,19}$/.test(digits)) {
        errs.cardNumber = "Enter a valid card number.";
      }
      if (!/^\d{2}\/[0-9]{2}$/.test(form.cardExpiry)) {
        errs.cardExpiry = "Use MM/YY format.";
      }
      if (!/^\d{3,4}$/.test(form.cardCvc)) {
        errs.cardCvc = "Enter a valid CVC.";
      }
    }
    if (!form.agreeToTerms) {
      errs.agreeToTerms = "You must agree to the terms to place the order.";
    }
    return errs;
  };

  const validateContact = () => {
    const errs = {};
    if (!form.fullName || form.fullName.trim().length < 3) errs.fullName = "Please enter your full name (min 3 characters).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Please enter a valid email address.";
    if (!/^\+?[0-9\-\s]{7,15}$/.test(form.phone)) errs.phone = "Please enter a valid phone number.";
    setErrors((prev) => ({ ...prev, ...errs }));
    const first = Object.values(errs)[0];
    if (first) toast.error(String(first));
    return Object.keys(errs).length === 0;
  };

  const validateAddressForm = (f) => {
    const errs = {};
    if (!f.city) errs.city = "City is required.";
    if (!f.address1) errs.address1 = "Address line 1 is required.";
    if (!f.deliveryWindow) errs.deliveryWindow = "Please choose a delivery window.";
    if (!f.billingSameAsShipping) {
      if (!f.billingCity) errs.billingCity = "Billing city is required.";
      if (!f.billingAddress1) errs.billingAddress1 = "Billing address line 1 is required.";
    }
    return errs;
  };

  const validateAddress = () => {
    const errs = validateAddressForm(form);
    setErrors((prev) => ({ ...prev, ...errs }));
    const first = Object.values(errs)[0];
    if (first) toast.error(String(first));
    return Object.keys(errs).length === 0;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setMessage(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      if (errs.cart) toast.error(errs.cart);
      return;
    }
    setErrors({});
    setPlacing(true);
    try {
      // Optionally save address
      if (form.saveAddress) {
        try {
          const addrRes = await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              label: form.addressLabel || 'Home',
              country: form.country,
              city: form.city,
              area: form.area,
              address1: form.address1,
              postalCode: form.postalCode,
            })
          });
          if (addrRes?.ok) toast.success('Address saved');
        } catch {}
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          subtotal,
          discount,
          shipping,
          total,
          promoCode: appliedPromo,
          form,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to place order");
      clear();
      toast.success('Order placed successfully');
      router.push("/my-orders");
    } catch (e) {
      toast.error("Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sticky progress bar */}
      {(() => { const progress = Math.round(((step + 1) / 4) * 100); return (
        <div className="sticky top-0 z-20 -mx-4 mb-4 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ); })()}
      <h1 className="text-3xl font-bold mb-4">Checkout</h1>
      {/* Stepper */}
      <ol className="mb-6 flex flex-wrap items-center gap-3 text-sm" aria-label="Checkout steps">
        {["Contact", "Address", "Delivery & Payment", "Review"].map((label, i) => {
          const state = i < step ? "complete" : i === step ? "current" : "upcoming";
          return (
            <li key={label} className={`inline-flex items-center gap-2 ${i <= step ? "text-primary" : "text-muted-foreground"}`} aria-current={state === "current" ? "step" : undefined}>
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs border ${i <= step ? "bg-primary text-primary-foreground border-primary" : "bg-muted"}`}>
                {i < step ? <Check className="h-3.5 w-3.5" aria-hidden /> : (i + 1)}
              </span>
              <button type="button" className="hover:underline disabled:no-underline" onClick={() => setStep(i)} disabled={i > step}>{label}</button>
              {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />}
            </li>
          );
        })}
      </ol>

      {items.length === 0 && (
        <Card className="mb-8">
          <CardContent className="py-6">
            <p className="text-gray-600">Your cart is empty.</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/products">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer, Address, Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Contact */}
          <Card ref={refContact}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary" aria-hidden /> Contact Information</CardTitle>
              <CardDescription>We use this to send order updates and delivery info.</CardDescription>
            </CardHeader>
            {step === 0 ? (
              <CardContent className="grid gap-4" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (validateContact()) setStep(1); } }}>
              {loadingProfile ? (
                <div className="space-y-3">
                  <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  <div className="h-5 w-40 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  <div className="h-5 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-10 w-full bg-muted rounded animate-pulse" />
                </div>
              ) : (
              <>
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={onChange} onBlur={(e)=>setForm((f)=>({...f, fullName: e.target.value.trim()}))} placeholder="John Doe" aria-invalid={!!errors.fullName} autoComplete="name" required />
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" id="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" aria-invalid={!!errors.email} autoComplete="email" required />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="01XXXXXXXXX" aria-invalid={!!errors.phone} autoComplete="tel" inputMode="tel" required />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>
              </div>
              </>
              )}
              </CardContent>
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span>{form.fullName}</span>
                  <span>{form.email}</span>
                  <span>{form.phone}</span>
                </div>
              </CardContent>
            )}
            <CardFooter>
              {step === 0 ? (
                <Button onClick={() => { if (validateContact()) setStep(1); }} className="ml-auto">Continue to Address</Button>
              ) : (
                <Button variant="secondary" onClick={() => setStep(0)} className="ml-auto">Change</Button>
              )}
            </CardFooter>
          </Card>

          {/* Step 2: Address */}
          <Card ref={refAddress}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" aria-hidden /> Shipping Address</CardTitle>
              <CardDescription>Where should we deliver your order?</CardDescription>
            </CardHeader>
            {step === 1 ? (
              <CardContent className="grid gap-4" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (validateAddress()) setStep(2); } }}>
                {loadingAddresses ? (
                  <div className="space-y-3">
                    <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                    <div className="h-5 w-28 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                    <div className="h-5 w-36 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-full bg-muted rounded animate-pulse" />
                  </div>
                ) : (
                <>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={form.city} onChange={onChange} onBlur={(e)=>setForm((f)=>({...f, city: e.target.value.trim()}))} placeholder="Dhaka" aria-invalid={!!errors.city} autoComplete="shipping address-level2" required />
                  {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="address1">Address</Label>
                  <Input id="address1" name="address1" value={form.address1} onChange={onChange} onBlur={(e)=>setForm((f)=>({...f, address1: e.target.value.trim()}))} placeholder="House, Road, Block, Landmark" aria-invalid={!!errors.address1} autoComplete="shipping street-address" required />
                  {errors.address1 && <p className="text-xs text-red-600">{errors.address1}</p>}
                  <p className="text-xs text-muted-foreground">Tip: Include house, road, block; add floor or landmark if helpful.</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="deliveryWindow">Delivery Window</Label>
                  <select id="deliveryWindow" name="deliveryWindow" className="h-10 w-full rounded-md border px-3 bg-white" value={form.deliveryWindow} onChange={onChange} aria-invalid={!!errors.deliveryWindow}>
                    <option value="">Select…</option>
                    <option value="9-12">9 AM - 12 PM</option>
                    <option value="12-3">12 PM - 3 PM</option>
                    <option value="3-6">3 PM - 6 PM</option>
                    <option value="6-9">6 PM - 9 PM</option>
                  </select>
                  {errors.deliveryWindow && <p className="text-xs text-red-600">{errors.deliveryWindow}</p>}
                </div>

                {/* Minimal by default; powerful when expanded */}
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Additional details</div>
                    <button type="button" className="inline-flex items-center gap-1 text-sm text-primary hover:underline" aria-expanded={showAddressMore} aria-controls="address-details" onClick={() => setShowAddressMore((v) => !v)}>
                      <span>{showAddressMore ? 'Hide' : 'Add details'}</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAddressMore ? 'rotate-180' : ''}`} aria-hidden />
                    </button>
                  </div>
                  {showAddressMore && (
                    <div id="address-details" className="mt-4 grid gap-4">
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="area">Area (optional)</Label>
                          <Input id="area" name="area" value={form.area} onChange={onChange} onBlur={(e)=>setForm((f)=>({...f, area: e.target.value.trim()}))} placeholder="Gulshan" autoComplete="shipping address-line2" />
              {suggestedAreas.length ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">Suggestions:</span>
                {suggestedAreas.map((s) => (
                                <button key={s} type="button" onClick={() => setForm((f)=>({...f, area: s }))} className={`h-7 rounded-md border px-2 text-xs ${form.area === s ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="postalCode">Postal Code (optional)</Label>
                          <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={onChange} placeholder="1212" inputMode="numeric" autoComplete="shipping postal-code" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="country">Country</Label>
                          <Input id="country" name="country" value={form.country} onChange={onChange} autoComplete="country-name" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="notes">Delivery Notes (optional)</Label>
                          <Input id="notes" name="notes" value={form.notes} onChange={onChange} placeholder="e.g., Call on arrival, gate code" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Address Label</Label>
                          <div className="flex flex-wrap gap-2">
                            {['Home','Office','Other'].map((lbl) => (
                              <button key={lbl} type="button" onClick={() => setForm((f) => ({ ...f, addressLabel: lbl }))} className={`h-8 rounded-md border px-3 text-sm ${form.addressLabel === lbl ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'}`}>
                                {lbl}
                              </button>
                            ))}
                            <div className="flex-1 min-w-40">
                              <Input id="addressLabel" name="addressLabel" value={form.addressLabel} onChange={onChange} onBlur={(e)=>setForm((f)=>({...f, addressLabel: e.target.value.trim()}))} placeholder="Custom label" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input id="saveAddress" name="saveAddress" type="checkbox" checked={form.saveAddress} onChange={onChange} />
                        <Label htmlFor="saveAddress">Save/Update this address</Label>
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}
              </CardContent>
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  {loadingAddresses ? (
                    <>
                      <span className="h-4 w-64 bg-muted rounded animate-pulse" />
                      <span className="h-4 w-48 bg-muted rounded animate-pulse" />
                      <span className="h-4 w-24 bg-muted rounded animate-pulse" />
                    </>
                  ) : (
                    <>
                      <span>{form.address1}</span>
                      <span>{form.area && `${form.area}, `}{form.city}</span>
                      <span>{form.postalCode}</span>
                      <span>{form.country}</span>
                      <span>Delivery Window: {form.deliveryWindow || '-'}</span>
                    </>
                  )}
                </div>
              </CardContent>
            )}
            <CardFooter className="flex justify-between">
              {step === 1 ? (
                <>
                  <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                  <Button onClick={() => { if (validateAddress()) setStep(2); }}>Continue to Delivery & Payment</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setStep(1)} className="ml-auto">Change</Button>
              )}
            </CardFooter>
          </Card>

          {/* Billing */}
          <Card ref={refPayment}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" aria-hidden /> Billing Address</CardTitle>
              <CardDescription>Optional — only fill if different from shipping.</CardDescription>
            </CardHeader>
            <CardContent className={`grid gap-4 ${step >= 1 ? '' : 'opacity-60 pointer-events-none select-none'}`}>
              <div className="flex items-center gap-2">
                <input
                  id="billingSameAsShipping"
                  type="checkbox"
                  checked={form.billingSameAsShipping}
                  onChange={(e) => setForm((f) => ({ ...f, billingSameAsShipping: e.target.checked }))}
                />
                <Label htmlFor="billingSameAsShipping">Same as shipping</Label>
              </div>

              {!form.billingSameAsShipping && (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="billingCountry">Country</Label>
                      <Input id="billingCountry" name="billingCountry" value={form.billingCountry} onChange={onChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billingCity">City</Label>
                      <Input id="billingCity" name="billingCity" value={form.billingCity} onChange={onChange} placeholder="Dhaka" aria-invalid={!!errors.billingCity} />
                      {errors.billingCity && <p className="text-xs text-red-600">{errors.billingCity}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billingArea">Area</Label>
                      <Input id="billingArea" name="billingArea" value={form.billingArea} onChange={onChange} placeholder="Gulshan" />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="billingAddress1">Address Line 1</Label>
                      <Input id="billingAddress1" name="billingAddress1" value={form.billingAddress1} onChange={onChange} placeholder="House, Road" aria-invalid={!!errors.billingAddress1} />
                      {errors.billingAddress1 && <p className="text-xs text-red-600">{errors.billingAddress1}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="billingPostalCode">Postal Code</Label>
                      <Input id="billingPostalCode" name="billingPostalCode" value={form.billingPostalCode} onChange={onChange} placeholder="1212" />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Delivery & Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5 text-primary" aria-hidden /> Delivery & Payment</CardTitle>
              <CardDescription>Choose a shipping speed and how you want to pay.</CardDescription>
            </CardHeader>
            {step === 2 ? (
              <CardContent className="space-y-4">
              {/* Shipping method */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Shipping</div>
                <div className="inline-grid grid-cols-3 gap-1 rounded-lg border bg-muted/30 p-1 text-sm" role="tablist" aria-label="Shipping method">
                  {[
                    { key: 'pickup', label: 'Pickup', sub: 'Free' },
                    { key: 'standard', label: 'Standard', sub: `${formatBDT(60)}` },
                    { key: 'express', label: 'Express', sub: `${formatBDT(120)}` },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      role="tab"
                      aria-selected={form.shippingMethod === opt.key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, shippingMethod: opt.key }))}
                      className={`rounded-md px-3 py-2 text-left transition-colors ${form.shippingMethod === opt.key ? 'bg-background border shadow-sm' : 'text-muted-foreground'} border`}
                    >
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-xs">{opt.sub}</div>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">{deliveryEstimate}</div>
              </div>

              {/* Payment options */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Payment</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { key: 'cod', label: 'Cash on Delivery', icon: Wallet },
                    { key: 'bkash', label: 'bKash', icon: CreditCardIcon },
                    { key: 'card', label: 'Credit/Debit Card', icon: CreditCardIcon },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, paymentMethod: opt.key }))}
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-colors ${form.paymentMethod === opt.key ? 'bg-background border-primary shadow-sm' : 'bg-muted/20'}`}
                      aria-pressed={form.paymentMethod === opt.key}
                    >
                      <opt.icon className="h-5 w-5 text-primary" aria-hidden />
                      <span className="text-sm">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {form.paymentMethod === "bkash" && (
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="bkashNumber">bKash Number</Label>
                      <Input id="bkashNumber" name="bkashNumber" value={form.bkashNumber} onChange={onChange} placeholder="01XXXXXXXXX" aria-invalid={!!errors.bkashNumber} />
                      {errors.bkashNumber && <p className="text-xs text-red-600">{errors.bkashNumber}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bkashTxnId">Transaction ID</Label>
                      <Input id="bkashTxnId" name="bkashTxnId" value={form.bkashTxnId} onChange={onChange} placeholder="e.g., 7G5H3K" aria-invalid={!!errors.bkashTxnId} />
                      {errors.bkashTxnId && <p className="text-xs text-red-600">{errors.bkashTxnId}</p>}
                    </div>
                  </div>
                )}

                {form.paymentMethod === "card" && (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="grid gap-2 md:col-span-2">
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input id="cardNumber" name="cardNumber" value={form.cardNumber} onChange={onChange} placeholder="1234 5678 9012 3456" aria-invalid={!!errors.cardNumber} />
                      {errors.cardNumber && <p className="text-xs text-red-600">{errors.cardNumber}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cardExpiry">Expiry (MM/YY)</Label>
                      <Input id="cardExpiry" name="cardExpiry" value={form.cardExpiry} onChange={onChange} placeholder="MM/YY" aria-invalid={!!errors.cardExpiry} />
                      {errors.cardExpiry && <p className="text-xs text-red-600">{errors.cardExpiry}</p>}
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cardCvc">CVC</Label>
                      <Input id="cardCvc" name="cardCvc" value={form.cardCvc} onChange={onChange} placeholder="CVC" aria-invalid={!!errors.cardCvc} />
                      {errors.cardCvc && <p className="text-xs text-red-600">{errors.cardCvc}</p>}
                    </div>
                  </div>
                )}
              </div>
              </CardContent>
            ) : (
              <CardContent className="text-sm text-muted-foreground">
                <div className="flex flex-col gap-0.5">
                  <span>Shipping: {form.shippingMethod === 'pickup' ? 'Store Pickup' : form.shippingMethod === 'express' ? 'Express' : 'Standard'}</span>
                  <span>Payment: {form.paymentMethod === 'cod' ? 'Cash on Delivery' : form.paymentMethod === 'bkash' ? 'bKash' : 'Card'}</span>
                </div>
              </CardContent>
            )}
            <CardFooter className="flex justify-between">
              {step === 2 ? (
                <>
                  <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  <Button onClick={() => setStep(3)}>Review Order</Button>
                </>
              ) : (
                <Button variant="secondary" onClick={() => setStep(2)} className="ml-auto">Change</Button>
              )}
            </CardFooter>
          </Card>

          {/* Step 4: Review & Confirm */}
          <Card ref={refReview} className={step === 3 ? '' : 'hidden'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" aria-hidden /> Review & Confirm</CardTitle>
              <CardDescription>Double-check details before placing your order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>Contact</span>
                    <button className="text-xs text-primary hover:underline" type="button" onClick={() => setStep(0)}>Change</button>
                  </div>
                  <div className="text-muted-foreground">
                    <div>{form.fullName}</div>
                    <div>{form.email}</div>
                    <div>{form.phone}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>Shipping Address</span>
                    <button className="text-xs text-primary hover:underline" type="button" onClick={() => setStep(1)}>Change</button>
                  </div>
                  <div className="text-muted-foreground">
                    <div>{form.address1}</div>
                    <div>{form.area && `${form.area}, `}{form.city}</div>
                    <div>{form.postalCode}</div>
                    <div>{form.country}</div>
                    <div>Delivery Window: {form.deliveryWindow || '-'}</div>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>Delivery & Payment</span>
                    <button className="text-xs text-primary hover:underline" type="button" onClick={() => setStep(2)}>Change</button>
                  </div>
                  <div className="text-muted-foreground space-y-1">
                    <div>Shipping: {form.shippingMethod === 'pickup' ? 'Store Pickup' : form.shippingMethod === 'express' ? 'Express' : 'Standard'}</div>
                    <div>Payment: {form.paymentMethod === 'cod' ? 'Cash on Delivery' : form.paymentMethod === 'bkash' ? 'bKash' : 'Card'}</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">Notes</div>
                  <div className="text-muted-foreground whitespace-pre-wrap break-words min-h-6">{form.notes || '-'}</div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={placeOrder} disabled={placing || items.length === 0 || !form.agreeToTerms}>{placing ? 'Placing Order...' : `Place Order (${formatBDT(total)})`}</Button>
            </CardFooter>
          </Card>

          {/* Payment moved to order summary */}
        </div>

        {/* Right: Order Summary */}
  <div className="space-y-6 lg:sticky lg:top-24">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {syncingCart ? (
                <ul className="divide-y">
                  {Array.from({ length: Math.max(2, items.length || 2) }).map((_, i) => (
                    <li key={i} className="py-3 flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
                      </div>
                      <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                    </li>
                  ))}
                </ul>
              ) : items.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-gray-600">No items.</p>
                  <Button asChild variant="secondary"><Link href="/products">Continue shopping</Link></Button>
                </div>
              ) : (
                <ul className="divide-y max-h-64 overflow-auto pr-1">
                  {items.map((it) => (
                    <li key={it.id} className="py-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it.image && <img src={it.image} alt="" className="h-12 w-12 rounded object-cover" />}
                      <div className="flex-1">
                        <div className="text-sm font-medium line-clamp-1">{it.name}</div>
                        <div className="text-xs text-gray-500">{formatBDT(it.price)}</div>
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => updateQty(it.id, Number(e.target.value))}
                        className="w-16 rounded border px-2 py-1 text-sm"
                      />
                      <button className="text-xs text-red-600 hover:underline" onClick={() => removeItem(it.id)}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Input placeholder="Promo code" value={promoCode} onChange={(e) => { setPromoCode(e.target.value); setPromoMessage(null); }} />
                </div>
                <Button onClick={applyPromo} variant="secondary"><BadgePercent className="h-4 w-4 mr-1" aria-hidden /> Apply</Button>
              </div>
              {/* Promo feedback below the input */}
              {promoMessage && (
                <div className={`text-sm ${promoMessage.type === "error" ? "text-red-600" : "text-green-600"}`}>
                  {promoMessage.text}
                </div>
              )}

              <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>{formatBDT(subtotal)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span className="text-red-600">- {formatBDT(discount)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>{formatBDT(shipping)}</span></div>
                {form.paymentMethod === 'cod' && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="codFeeEnabled" checked={form.codFeeEnabled} onChange={onChange} /> COD Service Fee
                    </label>
                    <span>{formatBDT(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>{formatBDT(total)}</span></div>
              </div>
              <div className="pt-4 border-t space-y-3">
                <div className="flex items-center gap-2">
                  <input id="agreeToTerms" name="agreeToTerms" type="checkbox" checked={form.agreeToTerms} onChange={onChange} />
                  <Label htmlFor="agreeToTerms" className="text-sm">I agree to the terms and conditions.</Label>
                </div>

                <Button className="w-full" onClick={placeOrder} disabled={placing || items.length === 0 || !form.agreeToTerms || step !== 3}>
                  {placing ? "Placing Order..." : `Place Order (${formatBDT(total)})`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Toasts are shown via sonner; inline message card removed */}
        </div>
      </div>
    </div>
  );
}
