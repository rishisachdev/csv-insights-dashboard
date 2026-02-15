from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import pandas as pd
import io
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

llm_available = False
model = None

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.5-flash")
        llm_available = True
    except Exception:
        llm_available = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "CSV Insights API is running"}

@app.get("/health")
def health():
    return {"backend": "ok"}

@app.get("/status")
def status():
    return {
        "backend": "ok",
        "llm": "connected" if llm_available else "not_configured"
    }

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    except Exception:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid or corrupted CSV file."}
        )

    if df.empty:
        return JSONResponse(
            status_code=400,
            content={"error": "Uploaded CSV is empty."}
        )

    preview = df.head(20).to_dict(orient="records")
    columns = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=["number"]).columns

    stats = {}
    trends = {}
    outliers = {}
    insight_text = []

    for col in numeric_cols:
        try:
            stats[col] = {
                "mean": round(float(df[col].mean()), 2),
                "min": round(float(df[col].min()), 2),
                "max": round(float(df[col].max()), 2),
                "missing": int(df[col].isna().sum())
            }

            first = df[col].head(max(1, len(df) // 5)).mean()
            last = df[col].tail(max(1, len(df) // 5)).mean()

            if last > first:
                trends[col] = "Increasing"
            elif last < first:
                trends[col] = "Decreasing"
            else:
                trends[col] = "Stable"

            q1 = df[col].quantile(0.25)
            q3 = df[col].quantile(0.75)
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr

            count = df[(df[col] < lower) | (df[col] > upper)].shape[0]
            outliers[col] = int(count)

            insight_text.append(
                f"{col}: Trend is {trends[col]}, "
                f"{outliers[col]} potential outliers detected. "
                f"Mean value is {stats[col]['mean']}."
            )
        except Exception:
            continue

    if not insight_text:
        insight_text.append("No numeric columns detected for analysis.")

    llm_summary = None

    if llm_available:
        try:
            prompt = f"""
You are a data analyst.

Statistics:
{stats}

Trends:
{trends}

Outliers:
{outliers}

Write a concise 3-4 sentence summary explaining key patterns and what should be checked next.
"""
            response = model.generate_content(prompt)
            if hasattr(response, "text") and response.text:
                llm_summary = response.text.strip()
            elif hasattr(response, "candidates"):
                llm_summary = response.candidates[0].content.parts[0].text
        except Exception:
            llm_summary = "LLM summary unavailable."

    def convert_types(obj):
        if isinstance(obj, dict):
            return {k: convert_types(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [convert_types(i) for i in obj]
        if hasattr(obj, "item"):
            return obj.item()
        return obj

    response = {
        "preview": preview,
        "columns": columns,
        "stats": stats,
        "insights": insight_text,
        "llm_summary": llm_summary
    }

    return convert_types(response)

class AskRequest(BaseModel):
    question: str
    context: dict

@app.post("/ask")
def ask_llm(request: AskRequest):
    if not llm_available:
        return {"answer": "LLM is not configured."}

    try:
        prompt = f"""
You are a data analyst.

Here is statistical context:
{request.context}

User question:
{request.question}

Provide a concise and helpful answer.
"""
        response = model.generate_content(prompt)
        if hasattr(response, "text") and response.text:
            return {"answer": response.text.strip()}
        elif hasattr(response, "candidates"):
            return {"answer": response.candidates[0].content.parts[0].text}
        return {"answer": "Unable to generate response."}
    except Exception:
        return {"answer": "Unable to generate response."}


