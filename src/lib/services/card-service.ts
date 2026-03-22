import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DiscountCard {
  id: string;
  plan_type: string;
  discount_percent: number;
  status: string;
  valid_until: string | null;
  price_monthly: number;
}

export interface CardBenefits {
  hasActiveCard: boolean;
  discountPercent: number;
  planType: string | null;
  validUntil: string | null;
  freeReschedulesPerYear: number;
  usedReschedules: number;
  remainingReschedules: number;
  prioritySupport: boolean;
}

// ─── Reschedule Limits by Plan ────────────────────────────────────────────────

const RESCHEDULE_LIMITS: Record<string, number> = {
  prata_familiar: 2,
  ouro_individual: 4,
  ouro_familiar: 4,
  diamante_familiar: 6,
};

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Fetch the active discount card for a user.
 */
export const getActiveCard = async (userId: string): Promise<DiscountCard | null> => {
  try {
    const { data } = await supabase
      .from("discount_cards")
      .select("id, plan_type, discount_percent, status, valid_until, price_monthly")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data as DiscountCard | null;
  } catch (err) {
    logError("getActiveCard failed", err);
    return null;
  }
};

/**
 * Get complete card benefits for a user, including reschedule limits.
 */
export const getCardBenefits = async (userId: string): Promise<CardBenefits> => {
  const card = await getActiveCard(userId);
  if (!card) {
    return {
      hasActiveCard: false,
      discountPercent: 0,
      planType: null,
      validUntil: null,
      freeReschedulesPerYear: 0,
      usedReschedules: 0,
      remainingReschedules: 0,
      prioritySupport: false,
    };
  }

  const freeReschedules = RESCHEDULE_LIMITS[card.plan_type] ?? 2;

  // Count reschedules this year
  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  yearStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("patient_id", userId)
    .eq("cancel_reason", "Reagendado pelo paciente")
    .gte("created_at", yearStart.toISOString());

  const usedReschedules = count ?? 0;

  return {
    hasActiveCard: true,
    discountPercent: card.discount_percent,
    planType: card.plan_type,
    validUntil: card.valid_until,
    freeReschedulesPerYear: freeReschedules,
    usedReschedules,
    remainingReschedules: Math.max(0, freeReschedules - usedReschedules),
    prioritySupport: ["ouro_familiar", "diamante_familiar"].includes(card.plan_type),
  };
};

/**
 * Check if user's card is about to expire (within X days).
 */
export const isCardExpiringSoon = async (userId: string, withinDays = 7): Promise<boolean> => {
  const card = await getActiveCard(userId);
  if (!card?.valid_until) return false;
  const expiresAt = new Date(card.valid_until);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + withinDays);
  return expiresAt <= threshold;
};

/**
 * Calculate the effective price for a card holder.
 */
export const calculateCardPrice = (basePrice: number, discountPercent: number): number => {
  return Math.max(0, Math.round(basePrice * (1 - discountPercent / 100) * 100) / 100);
};

/**
 * Check if user can reschedule for free (card benefit).
 */
export const canRescheduleFree = async (userId: string): Promise<boolean> => {
  const benefits = await getCardBenefits(userId);
  return benefits.hasActiveCard && benefits.remainingReschedules > 0;
};
