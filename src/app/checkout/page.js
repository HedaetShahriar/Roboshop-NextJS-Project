"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "next-auth/react";

const KNOWN_PROMOS = {
  ROBO10: { type: "percent", value: 10, label: "10% OFF" },
  ROBO20: { type: "percent", value: 20, label: "20% OFF" },
  SAVE50: { type: "flat", value: 50, label: "$50 OFF" },
};

export default function CheckoutPage() {
  const { items, subtotal, updateQty, removeItem, clear } = useCart();
  const router = useRouter();
  const { data: session } = useSession();

  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoMessage, setPromoMessage] = useState(null);
  const [message, setMessage] = useState(null);
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});

  // Address and contact fields
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "Bangladesh",
    city: "",
    area: "",
    address1: "",
    address2: "",
    postalCode: "",
    notes: "",
    billingSameAsShipping: true,
    billingCountry: "Bangladesh",
    billingCity: "",
    billingArea: "",
    billingAddress1: "",
    billingAddress2: "",
    billingPostalCode: "",
    paymentMethod: "cod", // cod | bkash | card
    bkashNumber: "",
    bkashTxnId: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
  });

  const discount = useMemo(() => {
    if (!appliedPromo) return 0;
    const promo = KNOWN_PROMOS[appliedPromo];
    if (!promo) return 0;
    if (promo.type === "percent") return Math.min(subtotal * (promo.value / 100), subtotal);
    if (promo.type === "flat") return Math.min(promo.value, subtotal);
    return 0;
  }, [appliedPromo, subtotal]);

  const shipping = 0; // can be extended later
  const total = Math.max(0, subtotal - discount + shipping);

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
        // Fetch addresses and pick Home -> first
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
              address2: f.address2 || preferred.address2 || "",
              postalCode: f.postalCode || preferred.postalCode || "",
              // keep billing as same by default
            }));
          }
        }
      } catch (_) {
        // ignore prefill failures
      }
    }
    prefill();
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (!KNOWN_PROMOS[code]) {
      setPromoMessage({ type: "error", text: "Invalid promo code." });
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(code);
    setPromoMessage({ type: "success", text: `Applied ${KNOWN_PROMOS[code].label}` });
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
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
    return errs;
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    setMessage(null);
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      setMessage(errs.cart ? { type: "error", text: errs.cart } : null);
      return;
    }
    setErrors({});
    setPlacing(true);
    try {
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
      router.push("/my-orders");
    } catch (e) {
      setMessage({ type: "error", text: "Failed to place order. Please try again." });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

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
          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" value={form.fullName} onChange={onChange} placeholder="John Doe" aria-invalid={!!errors.fullName} required />
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName}</p>}
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input type="email" id="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" aria-invalid={!!errors.email} required />
                  {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" value={form.phone} onChange={onChange} placeholder="01XXXXXXXXX" aria-invalid={!!errors.phone} required />
                  {errors.phone && <p className="text-xs text-red-600">{errors.phone}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" name="country" value={form.country} onChange={onChange} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" name="city" value={form.city} onChange={onChange} placeholder="Dhaka" aria-invalid={!!errors.city} required />
                  {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="area">Area</Label>
                  <Input id="area" name="area" value={form.area} onChange={onChange} placeholder="Gulshan" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="address1">Address Line 1</Label>
                  <Input id="address1" name="address1" value={form.address1} onChange={onChange} placeholder="House, Road" aria-invalid={!!errors.address1} required />
                  {errors.address1 && <p className="text-xs text-red-600">{errors.address1}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address2">Address Line 2</Label>
                  <Input id="address2" name="address2" value={form.address2} onChange={onChange} placeholder="Apartment, Suite (optional)" />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input id="postalCode" name="postalCode" value={form.postalCode} onChange={onChange} placeholder="1212" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Order Notes</Label>
                  <Input id="notes" name="notes" value={form.notes} onChange={onChange} placeholder="Delivery notes (optional)" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
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
                    <div className="grid gap-2">
                      <Label htmlFor="billingAddress2">Address Line 2</Label>
                      <Input id="billingAddress2" name="billingAddress2" value={form.billingAddress2} onChange={onChange} placeholder="Apartment, Suite (optional)" />
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

          {/* Payment moved to order summary */}
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.length === 0 ? (
                <p className="text-gray-600">No items.</p>
              ) : (
                <ul className="divide-y">
                  {items.map((it) => (
                    <li key={it.id} className="py-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {it.image && <img src={it.image} alt="" className="h-12 w-12 rounded object-cover" />}
                      <div className="flex-1">
                        <div className="text-sm font-medium line-clamp-1">{it.name}</div>
                        <div className="text-xs text-gray-500">${it.price.toFixed(2)}</div>
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
                <Button onClick={applyPromo} variant="secondary">Apply</Button>
              </div>
              {/* Promo feedback below the input */}
              {promoMessage && (
                <div className={`text-sm ${promoMessage.type === "error" ? "text-red-600" : "text-green-600"}`}>
                  {promoMessage.text}
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Discount</span><span className="text-red-600">- ${discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>${shipping.toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold pt-2 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              {/* Payment options inside summary */}
              <div className="pt-4 border-t space-y-3">
                <div className="text-sm font-medium">Payment</div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <input type="radio" id="pm-cod" name="paymentMethod" value="cod" checked={form.paymentMethod === "cod"} onChange={onChange} />
                    <Label htmlFor="pm-cod">Cash on Delivery</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="pm-bkash" name="paymentMethod" value="bkash" checked={form.paymentMethod === "bkash"} onChange={onChange} />
                    <Label htmlFor="pm-bkash">bKash</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="radio" id="pm-card" name="paymentMethod" value="card" checked={form.paymentMethod === "card"} onChange={onChange} />
                    <Label htmlFor="pm-card">Credit/Debit Card</Label>
                  </div>
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

                <Button className="w-full" onClick={placeOrder} disabled={placing || items.length === 0}>
                  {placing ? "Placing Order..." : `Place Order (${total.toFixed(2)})`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {message && (
            <Card>
              <CardContent className={`py-3 ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
                {message.text}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
