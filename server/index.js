import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Finch from "@tryfinch/finch-api";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// store tokens in memory for local demo
const tokenStore = new Map();

/**
 * CREATE FINCH CONNECT SESSION
 */
app.post("/api/connect/session", async (req, res) => {
  try {
    const uniqueCustomerId = `local-demo-user-${Date.now()}`;

    const response = await fetch("https://api.tryfinch.com/connect/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.FINCH_CLIENT_ID}:${process.env.FINCH_CLIENT_SECRET}`
          ).toString("base64"),
      },
      body: JSON.stringify({
        customer_id: uniqueCustomerId,
        customer_name: "Local Demo User",
        products: ["company", "directory", "individual", "employment"],
        redirect_uri: process.env.REDIRECT_URI,
        sandbox: "finch",
      }),
    });

    const data = await response.json();

    console.log("CONNECT SESSION STATUS:", response.status);
    console.log("CONNECT SESSION DATA:", data);

    if (!response.ok) {
      return res.status(500).json({
        error: "Failed to create Finch Connect session",
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    console.error("CONNECT SESSION ERROR:", err);
    res.status(500).json({
      error: "Failed to create Finch Connect session",
      details: err.message,
    });
  }
});

/**
 * EXCHANGE CODE FOR ACCESS TOKEN
 */
app.post("/api/auth/exchange", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const response = await fetch("https://api.tryfinch.com/auth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.FINCH_CLIENT_ID,
        client_secret: process.env.FINCH_CLIENT_SECRET,
        code,
        redirect_uri: process.env.REDIRECT_URI,
      }),
    });

    const data = await response.json();

    console.log("TOKEN EXCHANGE STATUS:", response.status);
    console.log("TOKEN EXCHANGE DATA:", data);

    if (!response.ok) {
      return res.status(500).json({
        error: "Failed to exchange code for token",
        details: data,
      });
    }

    const connectionId = data.connection_id || Date.now().toString();
    tokenStore.set(connectionId, data.access_token);

    res.json({ connectionId });
  } catch (err) {
    console.error("TOKEN EXCHANGE ERROR:", err);
    res.status(500).json({
      error: "Failed to exchange code for token",
      details: err.message,
    });
  }
});

/**
 * HELPER
 */
function getClient(connectionId) {
  const accessToken = tokenStore.get(connectionId);
  if (!accessToken) return null;
  return new Finch({ accessToken });
}

/**
 * COMPANY
 */
app.get("/api/company/:connectionId", async (req, res) => {
  try {
    const client = getClient(req.params.connectionId);
    if (!client) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const data = await client.hris.company.retrieve();
    res.json(data);
  } catch (err) {
    res.status(400).json({
      error: "This provider does not implement company data.",
    });
  }
});

/**
 * DIRECTORY
 */
app.get("/api/directory/:connectionId", async (req, res) => {
  try {
    const client = getClient(req.params.connectionId);
    if (!client) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const data = await client.hris.directory.list();

    if (data.body?.code === 202) {
      return res.status(202).json({
        error: "Directory data is still syncing. Please refresh in a few seconds.",
      });
    }

    res.json(data);
  } catch (err) {
    res.status(400).json({
      error: "This provider does not implement directory data.",
    });
  }
});

/**
 * INDIVIDUAL
 */
app.post("/api/individual/:connectionId", async (req, res) => {
  const { individualId } = req.body;

  try {
    const client = getClient(req.params.connectionId);
    if (!client) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const data = await client.hris.individuals.retrieveMany({
      requests: [{ individual_id: individualId }],
    });

    const result = data.responses?.[0];

    if (!result || result.code !== 200) {
      return res.status(400).json({
        error: "This provider does not implement individual data for this employee.",
      });
    }

    res.json(result.body);
  } catch (err) {
    res.status(400).json({
      error: "This provider does not implement individual data.",
    });
  }
});

/**
 * EMPLOYMENT
 */
app.post("/api/employment/:connectionId", async (req, res) => {
  const { individualId } = req.body;

  try {
    const client = getClient(req.params.connectionId);
    if (!client) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const data = await client.hris.employments.retrieveMany({
      requests: [{ individual_id: individualId }],
    });

    const result = data.responses?.[0];

    if (!result || result.code !== 200) {
      return res.status(400).json({
        error: "This provider does not implement employment data for this employee.",
      });
    }

    res.json(result.body);
  } catch (err) {
    res.status(400).json({
      error: "This provider does not implement employment data.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});