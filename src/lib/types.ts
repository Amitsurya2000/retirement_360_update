// Shared types for the onboarding wizard form state.
import { z } from "zod";

export const profileSchema = z.object({
  // Step 1
  fullName: z.string().optional(),
  age: z.number().min(40).max(95),
  gender: z.enum(["male", "female", "other"]),
  maritalStatus: z.enum(["single", "married", "widowed", "divorced"]),
  spouseAge: z.number().min(18).max(100).optional().nullable(),
  dependents: z.number().min(0).max(10),
  cityTier: z.enum(["metro", "tier2", "tier3"]),

  // Step 2
  corpus: z.number().min(1_00_000),
  pensionMonthly: z.number().min(0),
  rentalMonthly: z.number().min(0),
  dividendMonthly: z.number().min(0),
  // Engine inputs
  epsMonthly: z.number().min(0).default(0),
  npsLumpSum: z.number().min(0).default(0),
  npsSubscriberSelf: z.boolean().default(true),
  fundsBreakdown: z.object({
    pf:              z.number().min(0).default(0),
    govScheme:       z.number().min(0).default(0),
    leaveEncashment: z.number().min(0).default(0),
    gratuity:        z.number().min(0).default(0),
    nps:             z.number().min(0).default(0),
    savings:         z.number().min(0).default(0),
  }).optional(),
  assetRealEstate: z.number().min(0),
  assetGold: z.number().min(0),
  assetEquity: z.number().min(0),
  assetFD: z.number().min(0),
  liabilityTotal: z.number().min(0),
  emiMonthly: z.number().min(0),
  hasHealthInsurance: z.boolean(),
  healthCover: z.number().min(0),

  // Step 3
  desiredMonthlyIncome: z.number().min(1000),
  expenseHousing: z.number().min(0),
  expenseFood: z.number().min(0),
  expenseMedical: z.number().min(0),
  expenseLifestyle: z.number().min(0),
  expenseTravel: z.number().min(0),
  expenseOther: z.number().min(0),
  inflationRate: z.number().min(0).max(20),

  // Step 4
  riskAppetite: z.enum(["conservative", "moderate", "balanced"]),
  planningHorizon: z.number().min(10).max(40),
  legacyAmount: z.number().min(0),
  // bucketListGoals now stores either: (legacy) array of strings, or (new) structured liabilities
  // with amount + year. Stored as JSON string in SQLite.
  bucketListGoals: z.array(z.union([
    z.string(),
    z.object({ name: z.string(), amount: z.number().min(0), year: z.number().min(0).max(40) }),
  ])).optional(),

  // Step 5
  healthConditions: z.array(z.string()).optional(),
  hobbies: z.array(z.string()).optional(),
  socialEngagement: z.number().min(1).max(10),
  relationshipFocus: z.array(z.string()).optional(),
});

export type ProfileData = z.infer<typeof profileSchema>;

export const defaultProfile: ProfileData = {
  fullName: "",
  age: 60,
  gender: "male",
  maritalStatus: "married",
  spouseAge: 58,
  dependents: 0,
  cityTier: "metro",

  corpus: 1_00_00_000, // ₹1 Cr
  pensionMonthly: 0,
  rentalMonthly: 0,
  dividendMonthly: 0,
  epsMonthly: 0,
  npsLumpSum: 0,
  npsSubscriberSelf: true,
  fundsBreakdown: undefined,
  assetRealEstate: 0,
  assetGold: 0,
  assetEquity: 0,
  assetFD: 0,
  liabilityTotal: 0,
  emiMonthly: 0,
  hasHealthInsurance: false,
  healthCover: 0,

  desiredMonthlyIncome: 80_000,
  expenseHousing: 15_000,
  expenseFood: 15_000,
  expenseMedical: 10_000,
  expenseLifestyle: 20_000,
  expenseTravel: 10_000,
  expenseOther: 10_000,
  inflationRate: 6,

  riskAppetite: "moderate",
  planningHorizon: 25,
  legacyAmount: 0,
  bucketListGoals: [],

  healthConditions: [],
  hobbies: [],
  socialEngagement: 5,
  relationshipFocus: [],
};
