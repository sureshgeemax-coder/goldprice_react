# Gold Price Rate Dashboard

React/Vite conversion of the ASP.NET MVC gold-rate dashboard. It preserves the dashboard, shop detail pages, About page, 22K/916 and 24K/999 rates, comparison calculations, historical charts, SGD currency conversion, source status, and purchase-price disclaimers.

## Local Development

Requirements: Node.js 20.19 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. The Vite development server also exposes the same Node API routes used by Vercel. It reads the existing workbook at `data/GoldRates.xlsx` and appends new successful observations to `.local/history.json`; that local history file is ignored by Git. Optional vendor URL overrides can be copied from `.env.example` into `.env`.

Run the domain and workbook regression checks with `npm test`.

## Excel And Live Rates

`data/GoldRates.xlsx` is the original `GoldRates` worksheet copied from the .NET application. It retains the existing 490 observations and the 11-column structure. The application reads it as a seed and never writes to the workbook. ExcelJS reads the rows; JSZip normalizes ClosedXML's prefixed spreadsheet XML in memory because that valid workbook format is not accepted directly by ExcelJS.

The four server-side fetchers retain the .NET source URLs, vendor-specific extraction rules, price validation, and Singapore timestamps. Successful fetches append actual observations only; a failed fetch displays the latest successful observation with a stale status. Charts use recorded observations and do not interpolate missing rates. The exchange converter uses Frankfurter's dated reference rates and does not affect the SGD prices.

## Production Build

```sh
npm run build
npm run preview
```

The production build is the static Vite app in `dist/`, alongside Node serverless functions in `api/`.

## Vercel

Set the project root to this directory, build command to `npm run build`, and output directory to `dist`. `vercel.json` includes the workbook in the API function bundle and rewrites `/about` and `/shop/:shop` to the React entry point.

Add a Vercel Blob store to the project before using live refresh in a deployment. Vercel must provide `BLOB_READ_WRITE_TOKEN`; the API stores the initial Excel history and later observations in the Blob instead of the function's temporary filesystem. Without it, the bundled workbook remains readable but refresh returns a clear configuration error and cannot persist new history. No other deployment environment variables are required; vendor URLs can optionally be overridden with the names in `.env.example`.

## Limitations

Shop rates are scraped from third-party pages using the same page selectors and formats as the .NET version. A vendor site redesign, network block, or anti-bot rule can interrupt a live fetch; in that case the application shows the last recorded successful rate when available. Frankfurter availability is also external. Rates remain indicative, GST treatment is not independently verified, and customers should confirm final prices with the shop.