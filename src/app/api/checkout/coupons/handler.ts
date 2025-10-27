import { supabase } from "@/lib/supabase/client";
import { Coupon } from "@/lib/store/types";
import { ApiHandlerError } from "../../shared";

export class CouponsHandler {
  private static verifyCouponValidity(coupon: Coupon): boolean {
    let isValid = true;
    if (coupon.expires_at) {
      const now = new Date();
      const expiresAt = new Date(coupon.expires_at);

      isValid = now < expiresAt;
    }

    if (coupon.usage_limit) {
      isValid = isValid && coupon.usage_count <= coupon.usage_limit;
    }

    return isValid;
  }

  static async verifyCoupon(code: string): Promise<Coupon> {
    try {
      const { data, error } = await supabase
        .from("checkout_coupons")
        .select("*")
        .eq("code", code)
        .single();

      if (error)
        throw new ApiHandlerError(
          "Failed to verify coupon: " + error.message,
          500
        );

      if (data === null) {
        throw new ApiHandlerError("Invalid coupon code", 400);
      }

      const validCoupon = this.verifyCouponValidity(data);
      if (!validCoupon) {
        throw new ApiHandlerError("Invalid coupon code", 400);
      }

      return data as Coupon;
    } catch (e) {
      if (e instanceof ApiHandlerError) {
        throw e;
      }
      throw new ApiHandlerError(
        `Failed to verify coupon: ${(e as Error).message}`
      );
    }
  }
}
