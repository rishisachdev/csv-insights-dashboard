import React, { useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function App() {
  const [data, setData] = useState(null);
  const [reports, setReports] = useState(
    JSON.parse(localStorage.getItem("reports")) || []
  );
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [llmLoading, setLlmLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await axios.post(`${BACKEND_URL}/analyze`, formData);

      if (res.data.error) {
        alert(res.data.error);
        setLoading(false);
        return;
      }

      setData(res.data);
      setAnswer(null);

      const updated = [
        { date: new Date().toLocaleString(), report: res.data },
        ...reports,
      ].slice(0, 5);

      setReports(updated);
      localStorage.setItem("reports", JSON.stringify(updated));
    } catch {
      alert("Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "report.txt";
    a.click();
  };

  const fetchStatus = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/status`);
      setStatus(res.data);
    } catch {
      setStatus({ backend: "unreachable", llm: "unknown" });
    }
  };

  const askQuestion = async () => {
    if (!question || !data) return;

    try {
      setLlmLoading(true);
      const res = await axios.post(`${BACKEND_URL}/ask`, {
        question,
        context: data.stats,
      });
      setAnswer(res.data.answer);
    } catch {
      alert("LLM follow-up unavailable.");
    } finally {
      setLlmLoading(false);
    }
  };

  const styles = {
    page: {
      backgroundColor: "#f5f7fb",
      minHeight: "100vh",
      padding: "40px 20px",
      fontFamily: "Arial, sans-serif",
    },
    container: {
      maxWidth: "1000px",
      margin: "0 auto",
    },
    title: {
      textAlign: "center",
      marginBottom: "30px",
    },
    card: {
      background: "#ffffff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      marginBottom: "20px",
    },
    button: {
      backgroundColor: "#2563eb",
      color: "#ffffff",
      border: "none",
      padding: "10px 18px",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    input: {
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      width: "60%",
      marginRight: "10px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "8px",
      borderBottom: "1px solid #eee",
      background: "#f8fafc",
    },
    td: {
      padding: "8px",
      borderBottom: "1px solid #f0f0f0",
    },
    statusBox: {
      marginTop: "10px",
      padding: "10px",
      background: "#eef2ff",
      borderRadius: "8px",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>CSV Insights Dashboard</h1>

        <div style={styles.card}>
          <button style={styles.button} onClick={fetchStatus}>
            Check System Status
          </button>
          {status && (
            <div style={styles.statusBox}>
              <p><strong>Backend:</strong> {status.backend}</p>
              <p><strong>LLM:</strong> {status.llm}</p>
            </div>
          )}
        </div>

        <div style={styles.card}>
          <input type="file" accept=".csv" onChange={handleUpload} />
          {loading && <p>Processing file...</p>}
        </div>

        {data && (
          <>
            <div style={styles.card}>
              <h2>Insights</h2>
              <ul>
                {data.insights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>

            {data.llm_summary && (
              <div style={styles.card}>
                <h2>AI Summary</h2>
                <p>{data.llm_summary}</p>
              </div>
            )}

            <div style={styles.card}>
              <button style={styles.button} onClick={exportReport}>
                Export Report
              </button>
            </div>

            <div style={styles.card}>
              <h2>Preview</h2>
              <div style={{ overflowX: "auto" }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      {data.columns.map((col) => (
                        <th key={col} style={styles.th}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.preview.map((row, idx) => (
                      <tr key={idx}>
                        {data.columns.map((col) => (
                          <td key={col} style={styles.td}>{row[col]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {Object.keys(data.stats || {}).length > 0 && (
              <div style={styles.card}>
                <h2>Chart</h2>
                <LineChart width={700} height={300} data={data.preview}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={data.columns[0]} />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={Object.keys(data.stats)[0]}
                    stroke="#2563eb"
                  />
                </LineChart>
              </div>
            )}

            <div style={styles.card}>
              <h2>Ask a Follow-up Question</h2>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask about trends or anomalies"
                style={styles.input}
              />
              <button style={styles.button} onClick={askQuestion}>
                Ask
              </button>
              {llmLoading && <p>Generating answer...</p>}
              {answer && (
                <div style={{ marginTop: "10px" }}>
                  <strong>Answer:</strong>
                  <p>{answer}</p>
                </div>
              )}
            </div>
          </>
        )}

        <div style={styles.card}>
          <h2>Last 5 Reports</h2>
          <ul>
            {reports.map((r, idx) => (
              <li key={idx}>{r.date}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
