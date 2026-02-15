# CSV Insights Dashboard

A full-stack web app that allows users to upload a CSV file and quickly explore statistical insights along with an AI-generated summary.

This project was built as part of a technical assessment.

## Tech Stack

Frontend:

- React
- Axios
- Recharts

Backend:

- Python
- FastAPI
- Pandas
- Uvicorn
- Google Gemini API (gemini-2.5-flash)

Storage:

- Browser localStorage (used for storing the last 5 reports)

## Features

- Upload a CSV file
- Preview the first 20 rows in a table
- Automatic numeric column detection
- Statistical insights including:
  - Mean, minimum, maximum
  - Missing value count
  - Trend detection (Increasing / Decreasing / Stable)
  - Outlier detection using the IQR method
- AI-generated summary using Gemini
- Optional AI follow-up question support
- Save and view the last 5 reports (stored locally in the browser)
- Export report as a downloadable text file
- Status page showing backend, storage, and LLM health
- Basic validation for empty or invalid CSV uploads

## Project Structure

csv-dashboard/

backend/  
 main.py  
 requirements.txt

frontend/  
 public/  
 src/  
 package.json

README.md  
AI_NOTES.md  
ABOUTME.md  
PROMPTS_USED.md  
.env.example

## Running Locally

Backend:

cd backend  
pip install -r requirements.txt  
python main.py

Runs on: http://localhost:8000

Frontend:

cd frontend  
npm install  
npm start

Runs on: http://localhost:3000

To enable AI summaries locally, create a `.env` file in the backend folder and add:

GEMINI_API_KEY=your_api_key_here

## Design Decisions

- CSV processing and statistics are handled server-side using Pandas.
- AI summaries are generated from structured statistics using Gemini.
- The LLM integration is environment-based and optional.
- Reports are stored in browser localStorage to keep the solution lightweight and aligned with the scope of the task.
- A status endpoint was included to show system health and make the architecture extensible.
