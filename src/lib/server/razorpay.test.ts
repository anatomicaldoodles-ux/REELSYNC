import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyCheckoutSignature, verifyWebhookSignature } from "./razorpay";

const secret = "test_secret_123";
const sign = (data: string) => createHmac("sha256", secret).update(data).digest("hex");

describe("Razorpay signatures", () => {
  it("accepts a valid checkout signature", () => {
    const sig = sign("order_ABC|pay_XYZ");
    expect(verifyCheckoutSignature("order_ABC", "pay_XYZ", sig, secret)).toBe(true);
  });
  it("rejects a tampered checkout signature", () => {
    const sig = sign("order_ABC|pay_XYZ");
    expect(verifyCheckoutSignature("order_ABC", "pay_OTHER", sig, secret)).toBe(false);
    expect(verifyCheckoutSignature("order_ABC", "pay_XYZ", sig.replace(/^./, "0"), secret)).toBe(false);
    expect(verifyCheckoutSignature("order_ABC", "pay_XYZ", "", secret)).toBe(false);
    expect(verifyCheckoutSignature("order_ABC", "pay_XYZ", sig, "")).toBe(false);
  });
  it("verifies webhook bodies against the webhook secret", () => {
    const body = JSON.stringify({ event: "payment.captured" });
    expect(verifyWebhookSignature(body, sign(body), secret)).toBe(true);
    expect(verifyWebhookSignature(body + " ", sign(body), secret)).toBe(false);
  });
});
