import { NextRequest, NextResponse } from "next/server";
import { CouponsHandler } from "../handler";
import { ApiHandlerError } from "@/app/api/shared";

export async function GET(req: NextRequest) {
  try {
    const params = new URL(req.url).searchParams;
    const code = params.get("code");

    if (!code) {
      return new NextResponse(
        JSON.stringify({ error: "Coupon code is required" }),
        { status: 400 }
      );
    }

    const coupon = await CouponsHandler.verifyCoupon(code);
    return new Response(JSON.stringify({ coupon }), { status: 200 });
  } catch (e) {
    const uiError = "This coupon is invalid or expired.";
    if (e instanceof ApiHandlerError) {
      return new NextResponse(JSON.stringify({ error: uiError }), {
        status: e.status,
      });
    }
    return new NextResponse(JSON.stringify({ error: uiError }), {
      status: 500,
    });
  }
}
