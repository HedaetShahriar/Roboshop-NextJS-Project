import { NextRequest, NextResponse } from "next/server";

interface Coupon {
  code: string;
  type: "percent" | "flat";
  value: number;
  label: string;
  minSubtotal: number;
}

// Simple, extensible coupon rule set. In production, fetch from DB.
const COUPONS: Coupon[] = [
  { code: "ROBO10", type: "percent", value: 10, label: "10% OFF", minSubtotal: 0 },
  {
    code: "ROBO20",
    type: "percent",
    value: 20,
    label: "20% OFF",
    minSubtotal: 1000,
  },
  { code: "SAVE50", type: "flat", value: 50, label: "৳ 50 OFF", minSubtotal: 300 },
];

interface ValidCouponResponse {
  valid: true;
  type: "percent" | "flat";
  value: number;
  label: string;
  minSubtotal: number;
}

interface InvalidCouponResponse {
  valid: false;
  reason?: string;
  minSubtotal?: number;
}

type CouponResponse = ValidCouponResponse | InvalidCouponResponse;

export async function GET(request: NextRequest): Promise<NextResponse<CouponResponse>> {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").toUpperCase().trim();
  const subtotal = Number(searchParams.get("subtotal") || 0) || 0;

  const found = COUPONS.find((c) => c.code === code);
  if (!found) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  if (subtotal < (found.minSubtotal || 0)) {
    return NextResponse.json(
      {
        valid: false,
        reason: `Minimum subtotal ${found.minSubtotal}`,
        minSubtotal: found.minSubtotal,
      },
      { status: 200 }
    );
  }
  return NextResponse.json({
    valid: true,
    type: found.type,
    value: found.value,
    label: found.label,
    minSubtotal: found.minSubtotal || 0,
  });
}
