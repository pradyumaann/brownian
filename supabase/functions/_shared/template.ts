// The fixed parts of a Brief: the same every day, so the morning routine does not send them and cannot change them.
// The intake endpoint merges them into each day's record (see merge.ts). Generated once by scripts/make-template.mjs from
// data/2026-11-13.ts, then edited by hand. A glossary entry without `today` takes its "Today:" line from the daily
// record's `glossToday`.

export interface GlossEntry { term: string; definition: string; short: string; today?: string }
export interface Template {
  holdingTypes: { id: string; n: string }[];
  gloss: Record<string, GlossEntry>;
  aliases: Record<string, string>;
  defaultHold: string[];
  defaultWatch: string[];
  method: string[];
}

export const TEMPLATE: Template = {
  "holdingTypes": [
    {
      "id": "index",
      "n": "Nifty index funds & large-cap SIPs"
    },
    {
      "id": "fin",
      "n": "Bank, NBFC & insurance stocks"
    },
    {
      "id": "mid",
      "n": "Mid & small-cap funds"
    },
    {
      "id": "flexi",
      "n": "Flexi-cap funds"
    },
    {
      "id": "elss",
      "n": "ELSS (tax-saver) funds"
    },
    {
      "id": "it",
      "n": "IT stocks & US/Nasdaq funds"
    },
    {
      "id": "gold",
      "n": "Gold ETFs, SGBs & jewellery"
    },
    {
      "id": "silver",
      "n": "Silver ETFs"
    },
    {
      "id": "debt",
      "n": "Debt funds & FDs"
    },
    {
      "id": "oil",
      "n": "Oil & gas stocks"
    },
    {
      "id": "consumer",
      "n": "Auto & FMCG stocks"
    },
    {
      "id": "realty",
      "n": "Real estate stocks & REITs"
    },
    {
      "id": "wallet",
      "n": "Your wallet: travel, fees, fuel, groceries"
    }
  ],
  "gloss": {
    "gift": {
      "term": "GIFT Nifty",
      "definition": "A Nifty futures contract traded in GIFT City, Gujarat, almost round the clock. It trades while Indian markets are shut, so it hints at how Nifty may open.",
      "short": "A Nifty 50 futures contract that trades in GIFT City, Gujarat, almost round the clock, including while Indian markets are shut. It hints at how Nifty may open."
    },
    "fii": {
      "term": "FII / DII",
      "definition": "Foreign institutional investors (overseas funds) and domestic institutional investors (Indian mutual funds, insurers). Exchanges publish their daily net buying or selling, first as provisional numbers.",
      "short": "FIIs are large overseas investors, such as foreign funds; DIIs are large Indian ones, such as mutual funds and insurers. Each evening the exchanges report how much each group bought or sold."
    },
    "vix": {
      "term": "Volatility index (VIX)",
      "definition": "A fear gauge built from option prices. It estimates how much the market expects to swing over the next 30 days. Higher means more nervous.",
      "short": "A number showing how much traders expect prices to swing over the next month. A higher number means they expect bigger swings and are more nervous."
    },
    "yield": {
      "term": "Bond yield",
      "definition": "The return a bond pays if held to maturity. When yields rise, bond prices fall, and safe bonds look more attractive versus stocks.",
      "short": "The yearly return from lending money to a government or company through a bond. When yields rise, older bonds paying less lose value."
    },
    "bp": {
      "term": "Basis point (bp)",
      "definition": "One-hundredth of a percentage point. 25bp = 0.25%.",
      "short": "A small unit for interest rates: one-hundredth of one percent. So 25 basis points means 0.25%."
    },
    "priced": {
      "term": "“Fully priced”",
      "definition": "Futures markets already assume the event will happen. If it happens, the surprise is small; if it doesn't, markets can move sharply.",
      "short": "Traders already expect it, so prices already reflect it. If it happens, markets barely move; if it does not, they can move a lot."
    },
    "riskoff": {
      "term": "Risk-off",
      "definition": "A shift in market mood: investors sell what they see as riskier, such as shares and emerging-market assets, and move into what they see as safer, such as the US dollar. Its opposite is risk-on.",
      "short": "A mood in which investors pull money out of riskier things, such as shares, and into things seen as safer, such as the US dollar."
    },
    "dxy": {
      "term": "Dollar index (DXY)",
      "definition": "The US dollar against six major currencies. A stronger dollar usually means a weaker rupee and lower gold prices.",
      "short": "A measure of the US dollar's strength against six other major currencies. When it rises, the rupee and gold usually fall."
    },
    "brent": {
      "term": "Brent crude",
      "definition": "The global oil benchmark. India imports most of its crude, so a higher Brent widens the trade deficit and can lift inflation.",
      "short": "The main world price for crude oil. India buys most of its oil abroad, so a higher price makes imports costlier and can push up prices at home."
    },
    "breadth": {
      "term": "Market breadth",
      "definition": "How many stocks rose versus fell. An index can be flat while most stocks fall; poor breadth means weakness is wider than the index shows.",
      "short": "How many shares rose compared with how many fell. It shows whether a move was shared by many companies or driven by a few big ones."
    },
    "momentum": {
      "term": "Momentum",
      "definition": "The tendency of recent winners to keep winning over 3–12 months. Over very short periods (1 month), sharp moves tend to partly reverse.",
      "short": "The habit of shares that rose in recent months to keep rising for a while. Over a few weeks, sharp moves often partly reverse."
    },
    "haven": {
      "term": "Safe-haven demand",
      "definition": "When investors are nervous they buy gold and government bonds. Money moving out of havens into stocks signals rising risk appetite.",
      "short": "When people get nervous they move money into things seen as safer, such as gold and government bonds. Money leaving them suggests nerves are easing."
    },
    "cpi": {
      "term": "CPI (retail inflation)",
      "definition": "Consumer Price Index: the change in prices households pay. The RBI targets 4%, with a tolerance band of 2–6%.",
      "short": "How much more the everyday things households buy cost than a year ago. India's central bank aims to keep it near 4%."
    },
    "wpi": {
      "term": "WPI (wholesale inflation)",
      "definition": "Wholesale Price Index: prices businesses pay for goods. It often leads retail inflation and affects company margins.",
      "short": "How much more the goods businesses buy in bulk cost than a year ago. It often moves before shop prices do."
    },
    "ppi": {
      "term": "PPI (US producer prices)",
      "definition": "The US equivalent of wholesale inflation. A hot PPI signals more consumer inflation ahead.",
      "short": "How fast the prices US businesses charge for their goods and services are rising. It can show where US shop prices are heading."
    },
    "repo": {
      "term": "Repo rate",
      "definition": "The rate at which the RBI lends to banks. It sets the floor for loan EMIs, FD rates and bond yields.",
      "short": "The interest rate at which India's central bank lends to banks. When it goes up, loan repayments and fixed-deposit rates usually go up too."
    },
    "mpc": {
      "term": "MPC (Monetary Policy Committee)",
      "definition": "The RBI's six-member committee that sets the repo rate. It meets about every two months and publishes its decision and each member's vote.",
      "short": "The group at India's central bank that decides the main interest rate. It meets about every two months."
    },
    "guidance": {
      "term": "Guidance",
      "definition": "A company's own forecast for coming quarters. Stocks often react more to guidance than to the quarter just reported.",
      "short": "What a company says it expects to earn in the coming months. Share prices often react more to this than to the results just announced."
    },
    "bmo": {
      "term": "BMO / AMC",
      "definition": "Before market open / after market close: when a company releases results. US AMC results land early next morning in India.",
      "short": "Before market open and after market close: when a company announces its results. US results after their close reach India early the next morning."
    },
    "omc": {
      "term": "OMC",
      "definition": "Oil marketing companies that refine and sell fuel. Their margins shrink when crude rises faster than pump prices.",
      "short": "Companies that refine crude oil and sell petrol and diesel. They earn less when oil gets dearer faster than pump prices rise."
    },
    "msci": {
      "term": "MSCI rebalance",
      "definition": "MSCI periodically changes which stocks are in its indices. Passive funds tracking them must buy additions and sell deletions on the effective date.",
      "short": "MSCI regularly updates which companies are in its share market measures. Funds that copy those measures then buy the companies added and sell those removed."
    },
    "prov": {
      "term": "Provisional data",
      "definition": "Early figures released the same evening. Final numbers can differ slightly a day later.",
      "short": "Early figures published the same evening. The final numbers come a day later and can differ slightly."
    },
    "rotation": {
      "term": "Sector rotation",
      "definition": "Money moving from one group of stocks to another as investors change their outlook, such as from consumption to financials.",
      "short": "Money moving from one group of companies to another, for example out of car makers and into banks, as investors change their views."
    },
    "pcr": {
      "term": "Put/call ratio",
      "definition": "Nifty options put volume divided by call volume. More puts than usual means traders are paying for protection, which sentiment indexes read as fear.",
      "short": "Compares contracts that pay if the Nifty falls with contracts that pay if it rises. More of the first kind than usual is read as fear.",
      "today": "No longer a Wander Index component (dropped 15 Nov 2026); the Wander Index page explains why."
    },
    "trend": {
      "term": "200-day moving average",
      "definition": "The average closing price over the last 200 sessions. An index far above it has risen fast; below it, the longer trend is down.",
      "short": "The average closing price over the last 200 trading days. Well above it means prices rose fast; below it means the longer trend is down.",
      "today": "Today: see the Wander Index's trend component."
    },
    "turbulence": {
      "term": "Turbulence",
      "definition": "How unusual today's mix of sector moves is compared with history: the Mahalanobis distance of Kritzman & Li (2010). High turbulence means sectors moved in ways they rarely do together.",
      "short": "How unusual today's mix of moves across groups of companies is compared with the past. When it is high, those groups moved in ways they rarely do together.",
      "today": "Today: see Risk on the Wander Index page."
    },
    "fragility": {
      "term": "Fragility (absorption ratio)",
      "definition": "How much of all sector moves is explained by a few common forces (Kritzman, Li, Page & Rigobon, 2011). When it is high, sectors move as one and a shock spreads faster.",
      "short": "How much groups of companies move together, pushed by the same few forces. When it is high, a shock in one place spreads faster.",
      "today": "Today: see Risk on the Wander Index page."
    },
    "sentiment": {
      "term": "Sentiment index",
      "definition": "A composite of market behaviour (volatility, breadth, momentum, flows, safe-haven demand) scaled 0–100. Extremes are read as contrarian signals.",
      "short": "A 0 to 100 score of how fearful or greedy the market is acting, built from price swings, how many shares rose, recent gains, money flows and gold.",
      "today": "Today: {score}, “{band}”."
    }
  },
  "aliases": {
    "state bank of india": "SBI",
    "hindustan unilever": "HUL",
    "nestle": "Nestle India",
    "maruti": "Maruti Suzuki",
    "mahindra": "M&M",
    "mahindra & mahindra": "M&M",
    "motherson": "Samvardhana Motherson",
    "alkem": "Alkem Laboratories",
    "alkem labs": "Alkem Laboratories",
    "hindustan aeronautics": "HAL",
    "one97": "Paytm",
    "zee": "Zee Entertainment",
    "life insurance corporation": "LIC",
    "vi": "Vodafone Idea",
    "grasim": "Grasim Industries",
    "eicher": "Eicher Motors",
    "abb": "ABB India",
    "tata motors": "Tata Motors PV",
    "rail vikas nigam": "RVNL",
    "natco": "Natco Pharma",
    "edelweiss": "Edelweiss Financial",
    "firstcry": "Brainbees (FirstCry)",
    "brainbees": "Brainbees (FirstCry)",
    "kaynes": "Kaynes Technology",
    "patanjali": "Patanjali Foods",
    "nvidia": "NVDA (Nvidia)",
    "nvda": "NVDA (Nvidia)",
    "broadcom": "AVGO (Broadcom)",
    "avgo": "AVGO (Broadcom)",
    "arista": "ANET (Arista)",
    "anet": "ANET (Arista)",
    "cisco": "CSCO (Cisco)",
    "csco": "CSCO (Cisco)",
    "applied materials": "AMAT (Applied Materials)",
    "amat": "AMAT (Applied Materials)",
    "cerebras": "CBRS (Cerebras)",
    "take-two": "TTWO (Take-Two)",
    "united airlines": "UAL (United Airlines)",
    "delta": "DAL (Delta)",
    "valero": "VLO (Valero)",
    "devon": "DVN (Devon)",
    "exxon": "XOM (Exxon)",
    "hd": "Home Depot",
    "wmt": "Walmart"
  },
  "defaultHold": [
    "index",
    "fin",
    "gold",
    "debt"
  ],
  "defaultWatch": [
    "Bajaj Finance",
    "Eicher Motors",
    "ONGC",
    "NVDA (Nvidia)",
    "Infosys"
  ],
  "method": [
    "CNN Business Fear & Greed Index: seven equal-weighted components scored 0–100.",
    "Tickertape Market Mood Index: FII activity, volatility, momentum, breadth, price strength, gold demand (India).",
    "Whaley, R. (2000). The Investor Fear Gauge. Journal of Portfolio Management.",
    "Baker, M. & Wurgler, J. (2006). Investor Sentiment and the Cross-Section of Stock Returns. Journal of Finance.",
    "Jegadeesh, N. (1990). Evidence of Predictable Behavior of Security Returns. Journal of Finance.",
    "Jegadeesh, N. & Titman, S. (1993). Returns to Buying Winners and Selling Losers. Journal of Finance.",
    "Calvo, G., Leiderman, L. & Reinhart, C. (1993). Capital Inflows and Real Exchange Rate Appreciation in Latin America: The Role of External Factors. IMF Staff Papers.",
    "Reference levels for India VIX and US VIX are approximate long-run medians used by this app; formulas are shown with each component."
  ]
};
