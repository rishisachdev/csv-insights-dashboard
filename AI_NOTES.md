# AI_NOTES.md

## AI Usage Overview

I used AI tools during development to speed up scaffolding, review logic, and improve clarity. All generated code was reviewed, tested, and modified as needed to ensure correctness and understanding.

Primary AI tool used:

- ChatGPT (OpenAI)

LLM integrated into the app:

- Google Gemini API (model: gemini-2.5-flash)

---

## Where AI Was Used

AI was used to:

- Generate initial FastAPI and React scaffolding
- Suggest structure for CSV parsing and statistical calculations
- Help refine the IQR-based outlier detection logic
- Improve clarity of trend detection implementation
- Draft documentation files (README, this file, etc.)
- Review environment variable handling for secure API key usage
- Improve the Gemini prompt for clearer summaries

---

## What Was Verified Manually

I manually reviewed and tested:

- CSV parsing using Pandas
- Statistical calculations (mean, min, max, missing values)
- Trend detection logic (first vs last segment comparison)
- React state management and localStorage persistence
- API integration between frontend and backend
- Gemini API connection and response parsing
- Error handling for invalid CSV uploads
- Hosting configuration and environment variable setup

All logic was tested locally and validated with multiple sample CSV files.

---

## LLM Integration Details

The application integrates with Google Gemini (gemini-2.5-flash) to generate a short natural-language summary based on structured statistical outputs.

The LLM is:

- Optional (controlled by environment variable)
- Not required for the deterministic statistical insights
- Used to enhance interpretability of results

The prompt is structured to provide statistics, trends, and outlier counts as input and request a concise summary.

No API keys are stored in the repository. Environment variables are used for configuration.

---

## Why This Approach

The goal was to use AI as a development assistant while maintaining full understanding of the implementation.

AI was used to accelerate development and improve clarity, but final decisions, architecture, and validation were done manually.
