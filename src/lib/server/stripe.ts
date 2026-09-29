import Stripe from "stripe";
import { env } from "./env";

let client: Stripe | undefined;

export function stripe(): Stripe {
  if (!env.stripeSecretKey) throw new Error("Stripe is not configured (STRIPE_SECRET_KEY missing)");
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}
