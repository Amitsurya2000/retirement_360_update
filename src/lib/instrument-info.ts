// Plain-English explanations for every financial instrument we recommend.
// These power the "Learn more" expandable sections in the bucket cards.

export interface InstrumentInfo {
  whatIsIt: string;
  whyGoodForYou: string;
  howToOpen: string;
  thingsToKnow: string[];
}

export const INSTRUMENT_INFO: Record<string, InstrumentInfo> = {
  "Senior Citizen Savings Scheme (SCSS)": {
    whatIsIt:
      "A special government savings scheme made just for senior citizens (60+). You give the government a lump sum, and they pay you interest every 3 months (quarterly) for 5 years. After 5 years you get your money back, or you can extend by another 3 years.",
    whyGoodForYou:
      "It's the safest, highest-paying option for retirees. Interest is currently 8.2% per year — paid every quarter, like a small salary. Backed by the Government of India, so your money cannot be lost. This should usually be the FIRST place you park money in retirement.",
    howToOpen:
      "Walk into any public-sector bank (SBI, PNB, Canara) or a Post Office with your PAN card, Aadhaar, and a passport-size photo. Account opens in 30 minutes. Minimum ₹1,000. Maximum ₹30 Lakh per person (so a couple can deposit ₹60L total).",
    thingsToKnow: [
      "Interest is taxable — but ₹50,000 of total interest is tax-free under Section 80TTB.",
      "Premature withdrawal is allowed after 1 year but with a penalty (1-1.5%).",
      "You can extend the account in 3-year blocks after the initial 5 years.",
    ],
  },

  "Post Office Monthly Income Scheme (POMIS)": {
    whatIsIt:
      "A Post Office savings scheme that gives you a fixed monthly income for 5 years. You deposit a lump sum and the Post Office pays you interest into your savings account every single month.",
    whyGoodForYou:
      "It mimics a monthly pension. Perfect if you want predictable money landing in your account every month for groceries, electricity bill, etc. Currently pays around 7.4% per year — paid monthly.",
    howToOpen:
      "Visit your nearest Post Office with PAN, Aadhaar, and a photo. Open a savings account with the Post Office (if you don't have one), then open POMIS linked to it. Minimum ₹1,000. Maximum ₹9 Lakh for a single account, ₹15 Lakh for a joint account with spouse.",
    thingsToKnow: [
      "Tenure is fixed at 5 years.",
      "Monthly interest is taxable but qualifies for the ₹50,000 80TTB deduction for seniors.",
      "Premature closure penalty: 1-2% of deposit.",
    ],
  },

  "Bank FD Ladder (1y / 2y / 3y)": {
    whatIsIt:
      "Instead of putting all your money in one Fixed Deposit, you split it into 3 equal parts and open three FDs — one matures in 1 year, one in 2 years, one in 3 years. When the 1-year FD matures, you reinvest it for 3 more years. This is called 'laddering'.",
    whyGoodForYou:
      "You always have some money becoming available each year (in case you need it), AND you keep catching the latest interest rates instead of locking everything at today's rate. If rates rise next year, your renewing FD captures that.",
    howToOpen:
      "Open at your existing bank — most banks let you split a deposit into multiple FDs in one transaction. Senior citizens get an extra 0.50% interest on every FD. Look for AAA-rated banks: SBI, HDFC, ICICI, Axis.",
    thingsToKnow: [
      "Senior citizen rate bonus: usually 0.50% extra. Always tell the bank you're a senior.",
      "Choose 'monthly' or 'quarterly' interest payout option if you want regular income; otherwise it compounds.",
      "Bank FDs have insurance up to ₹5 Lakh per bank under DICGC — split large deposits across 2-3 banks for full protection.",
    ],
  },

  "Liquid Mutual Fund (emergency reserve)": {
    whatIsIt:
      "A type of mutual fund that invests in very short-term, very safe instruments (overnight government bonds, treasury bills). The money earns ~6-7% per year, BUT you can withdraw it instantly — in your bank account within hours, no penalties.",
    whyGoodForYou:
      "Think of it as a smart savings account. Your savings account pays 3-4%; this pays ~6.5% and is just as safe. Perfect for the medical emergency fund — when grandchild needs ₹50,000 for an operation, you get it the same day.",
    howToOpen:
      "Open a free Demat + MF account on Zerodha Coin, Groww, or Kuvera (online, ~10 min using PAN + Aadhaar). Then invest in any AAA-rated liquid fund — examples: SBI Liquid Fund, ICICI Liquid Fund, HDFC Liquid Fund. Or visit any bank branch.",
    thingsToKnow: [
      "Tax: Gains taxed at your slab rate as 'income'.",
      "No lock-in. Withdraw any time. Even ₹10,000 withdrawals are allowed.",
      "Keep about 3-6 months of expenses here as your emergency reserve.",
    ],
  },

  "PMVVY (Pradhan Mantri Vaya Vandana Yojana)": {
    whatIsIt:
      "A government-backed pension scheme exclusively for senior citizens (60+), run by LIC. You give LIC a lump sum (up to ₹15L), and they guarantee you a monthly/quarterly/yearly pension for 10 years. After 10 years you get your principal back.",
    whyGoodForYou:
      "Guaranteed pension for 10 years — no market risk, no rate cuts. Currently around 7.4%. Combines well with SCSS to build a senior couple's monthly income.",
    howToOpen:
      "Visit any LIC branch with PAN, Aadhaar, age proof, and a photo. NOTE: PMVVY was previously time-limited; check with LIC whether it's still accepting new subscribers when you visit.",
    thingsToKnow: [
      "Tenure: 10 years, then principal returned.",
      "Maximum ₹15 Lakh per senior (so ₹30L for a couple).",
      "Premature exit allowed only for terminal illness; otherwise locked in.",
    ],
  },

  "RBI Floating Rate Savings Bonds": {
    whatIsIt:
      "Bonds issued directly by the Reserve Bank of India. You lend money to the RBI for 7 years; they pay you interest every 6 months. The interest rate 'floats' — it adjusts every 6 months based on the NSC rate (so it rises when rates rise).",
    whyGoodForYou:
      "100% safe (it's RBI). Pays around 8.05% currently — among the highest govt-backed yields. Floating rate means you don't get stuck with a low rate if interest rates rise in the future.",
    howToOpen:
      "Buy through any major bank: SBI, HDFC, ICICI, Axis, Bank of Baroda. You can also buy online through your bank's net banking. Minimum ₹1,000.",
    thingsToKnow: [
      "Tenure: 7 years (longer for very senior citizens).",
      "Interest paid every 6 months (Jan & July), credited to your bank account.",
      "Interest is fully taxable at your slab rate.",
    ],
  },

  "Debt Mutual Funds (SWP)": {
    whatIsIt:
      "Debt mutual funds invest in safe corporate bonds and government securities. SWP = Systematic Withdrawal Plan — you tell the fund to deposit a fixed amount (say ₹40,000) into your bank account every month.",
    whyGoodForYou:
      "You get monthly income AND it's much more tax-efficient than FDs. With FD interest, the WHOLE interest is taxed at your slab rate. With SWP, only the 'gain' portion of each withdrawal is taxed — usually a fraction of the FD tax. Over years, this can save you ₹2-5 Lakh in tax.",
    howToOpen:
      "Pick a conservative debt MF — Short Duration or Corporate Bond category from a top AMC (HDFC, ICICI Pru, SBI, Aditya Birla). Open via Zerodha Coin/Groww/Kuvera. Choose 'Growth' option, then set up an SWP after 3 years (to qualify for indexation benefit).",
    thingsToKnow: [
      "No fixed tenure — withdraw any month.",
      "Returns float around 7-8% — not guaranteed but historically stable.",
      "Tax is on gains only, not full withdrawal. Much better than FD for high-income retirees.",
    ],
  },

  "AAA-rated Corporate FDs": {
    whatIsIt:
      "Fixed Deposits issued by large, financially-strong companies (Bajaj Finance, HDFC Ltd, etc.) instead of banks. They typically pay 0.5-1% higher interest than bank FDs.",
    whyGoodForYou:
      "Higher returns than bank FDs (around 8%) and AAA rating means very low risk. Good for the income bucket if you want safety + better yield than a bank FD.",
    howToOpen:
      "Apply online at the company's website (Bajaj Finance, HDFC Limited) or through Zerodha/Smallcase. Submit PAN + KYC docs once, then renew/expand easily.",
    thingsToKnow: [
      "Only invest in AAA-rated companies — avoid AA or lower.",
      "Don't put more than 5% of your corpus in any single company (diversify).",
      "Interest is taxable; senior citizens get the 80TTB ₹50k deduction.",
    ],
  },

  "Tax-free Bonds (secondary market)": {
    whatIsIt:
      "Old bonds issued by government infrastructure companies (NHAI, IRFC, PFC) that pay interest you DON'T have to pay tax on. They're not being issued new anymore — you buy them from existing holders on the stock exchange.",
    whyGoodForYou:
      "Tax-free interest of ~6%. For someone in the 30% tax bracket, this is equivalent to a 8.5% taxable FD return. Perfect for high-income retirees who pay a lot of tax on FD interest.",
    howToOpen:
      "Buy through any stockbroker (Zerodha, ICICI Direct, etc.) — search for NHAI, IRFC, PFC, REC bonds. They trade on NSE/BSE. Need a Demat account.",
    thingsToKnow: [
      "Long tenures (10-20 years remaining).",
      "Price depends on current interest rates — may have to pay slightly above face value.",
      "Best for the 30% tax bracket; less useful if you're in lower brackets.",
    ],
  },

  "Conservative Hybrid Mutual Funds": {
    whatIsIt:
      "Mutual funds that mix 65-75% in safe debt and 25-35% in equity. You get most of the safety of debt with a small kick from equity growth.",
    whyGoodForYou:
      "A 'gentle' way to add equity to your portfolio. Returns historically around 9-10% — better than pure debt over 5+ years but with much less volatility than pure equity. Good for the growth bucket.",
    howToOpen:
      "Pick a top-rated Conservative Hybrid Fund from HDFC, ICICI Pru, or SBI. Open via Zerodha Coin/Groww. Choose 'Growth' option.",
    thingsToKnow: [
      "Treated as a debt fund for tax (LTCG with indexation after 3 years).",
      "Hold at least 3 years for tax efficiency.",
      "Small ups and downs are normal — don't panic sell.",
    ],
  },

  "Large-cap Equity MF (SWP after year 5)": {
    whatIsIt:
      "Mutual funds that invest in India's largest, most stable companies (TCS, Reliance, HDFC Bank, Infosys, etc.). You let it grow for 5 years untouched, then start an SWP for tax-efficient income.",
    whyGoodForYou:
      "This is your inflation-beater. Historically ~12% returns over long periods. The 5-year wait lets compound growth work; then SWP gives you tax-friendly monthly income (LTCG at just 12.5% above ₹1.25L tax-free).",
    howToOpen:
      "Pick an Index Fund (NIFTY 50, SENSEX) or a top large-cap fund (HDFC Top 100, ICICI Pru Bluechip). Open via Zerodha Coin. Choose 'Growth' option. After 5 years, set up SWP.",
    thingsToKnow: [
      "Don't check the value every day — it goes up AND down. Stay calm.",
      "First ₹1.25 Lakh of gains per year is tax-free (LTCG exemption).",
      "Best instrument for the LATER part of retirement (year 10+) when you need money to have grown.",
    ],
  },

  "Blue-chip Dividend Stocks": {
    whatIsIt:
      "Direct shares of India's most reliable, profitable companies that pay regular dividends — HDFC Bank, ITC, Hindustan Unilever, TCS, Coal India. You own a small piece of these companies and receive dividends (cash payouts) 2-4 times a year.",
    whyGoodForYou:
      "Two-way income: dividends AND share price growth. Companies like ITC and Coal India have paid dividends every year for 30+ years. For a comfortable retiree who can absorb some volatility, this can pay 3-5% per year just from dividends, on top of capital gains.",
    howToOpen:
      "Open a Demat account on Zerodha or any broker. Start small — pick 8-10 large-cap dividend payers. Don't try to time the market.",
    thingsToKnow: [
      "Diversify across at least 8-10 companies — never put more than 10% of growth bucket in any one stock.",
      "Dividends are taxable as 'income' at your slab rate.",
      "If you don't want to pick stocks yourself, use a Dividend Yield Mutual Fund instead.",
    ],
  },

  "REITs (Embassy, Mindspace, Brookfield)": {
    whatIsIt:
      "REIT = Real Estate Investment Trust. Owns large office buildings in Mumbai, Bengaluru, Pune, Hyderabad, rents them out to companies like Microsoft, Google, JP Morgan, and passes 90% of the rent on to you as quarterly payouts.",
    whyGoodForYou:
      "Real-estate-like income WITHOUT the headache of owning property — no tenants to chase, no repairs, no property tax to file. ~7-8% in distributions per year plus possible appreciation. Three are listed in India: Embassy, Mindspace, Brookfield.",
    howToOpen:
      "Buy on the stock exchange via any broker. Trades like a stock — search 'EMBASSY' on Zerodha. Minimum investment is just the unit price (around ₹350-400 per unit).",
    thingsToKnow: [
      "Distributions paid every 3 months.",
      "Tax: partly tax-free (dividend portion), partly taxable (interest portion). Complex — your CA or the REIT factsheet will clarify.",
      "Don't put more than 10-15% of growth bucket here — REITs can also decline when office demand falls.",
    ],
  },
};

export function getInstrumentInfo(name: string): InstrumentInfo | null {
  return INSTRUMENT_INFO[name] ?? null;
}
