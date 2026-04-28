import { Routes, Route, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL;

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function Field({ label, value }) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <strong>{label}:</strong> {formatValue(value)}
    </div>
  );
}

function Home() {
  const [error, setError] = useState("");
  const [company, setCompany] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [individual, setIndividual] = useState(null);
  const [employment, setEmployment] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [connectionId] = useState(localStorage.getItem("connectionId") || "");

  const startConnection = async () => {
    setError("");
    try {
      const res = await fetch(`${API}/api/connect/session`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create connect session");

      window.location.href = data.connect_url;
    } catch (err) {
      setError(err.message);
    }
  };

  const loadEmployerData = async (id) => {
    setError("");
    try {
      const [companyRes, directoryRes] = await Promise.all([
        fetch(`${API}/api/company/${id}`),
        fetch(`${API}/api/directory/${id}`),
      ]);

      const companyData = await companyRes.json();
      const directoryData = await directoryRes.json();

      if (!companyRes.ok) throw new Error(companyData.error || "Failed to load company");

      if (directoryRes.status === 202 || directoryData.body?.code === 202) {
        setCompany(companyData);
        setDirectory([]);
        setError("Directory data is still syncing. Refresh in a few seconds.");
        return;
      }

      if (!directoryRes.ok) {
        throw new Error(directoryData.error || "Failed to load directory");
      }

      setCompany(companyData);
      setDirectory(
        directoryData.individuals ||
          directoryData.body?.individuals ||
          directoryData.data ||
          directoryData.results ||
          []
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const selectEmployee = async (employee) => {
    setSelectedId(employee.id);
    setIndividual(null);
    setEmployment(null);
    setError("");

    try {
      const [indRes, empRes] = await Promise.all([
        fetch(`${API}/api/individual/${connectionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ individualId: employee.id }),
        }),
        fetch(`${API}/api/employment/${connectionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ individualId: employee.id }),
        }),
      ]);

      const indData = await indRes.json();
      const empData = await empRes.json();

      if (!indRes.ok) throw new Error(indData.error || "Failed to load individual");
      if (!empRes.ok) throw new Error(empData.error || "Failed to load employment");

      setIndividual(indData.body || indData);
      setEmployment(empData.body || empData);

      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (connectionId) {
      loadEmployerData(connectionId);
    }
  }, [connectionId]);

  return (
    <div style={{ padding: "24px", fontFamily: "Arial" }}>
      <h1>Finch Sandbox Challenge</h1>

      {!connectionId && (
        <button onClick={startConnection}>Connect to Finch Sandbox</button>
      )}

      {connectionId && (
        <button
          onClick={() => {
            localStorage.removeItem("connectionId");
            window.location.reload();
          }}
          style={{ marginLeft: "12px" }}
        >
          Reset Connection
        </button>
      )}

      {error && (
        <div style={{ color: "red", marginTop: "16px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {company && (
        <div style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2>Company</h2>
          <Field label="Legal Name" value={company.legal_name} />
          <Field label="EIN" value={company.ein} />
          <Field label="Entity Legal Name" value={company.entity?.legal_name} />
          <Field label="Primary Email" value={company.primary_email} />
          <Field label="Primary Phone" value={company.primary_phone_number} />
        </div>
      )}

      {directory.length > 0 && (
        <div style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2>Employee Directory</h2>
          {directory.map((employee) => (
            <div
              key={employee.id}
              style={{ marginBottom: "12px", paddingBottom: "12px", borderBottom: "1px solid #eee" }}
            >
              <button
                type="button"
                onClick={() => selectEmployee(employee)}
                style={{
                  padding: "6px 10px",
                  cursor: "pointer",
                  backgroundColor: selectedId === employee.id ? "#d3e5ff" : "white",
                }}
              >
                View {employee.first_name || "Unknown"} {employee.last_name || ""}
              </button>
              <div style={{ marginTop: "8px" }}>
                <Field label="Employee ID" value={employee.id} />
                <Field label="Department" value={employee.department?.name} />
              </div>
            </div>
          ))}
        </div>
      )}

      {individual && (
        <h2 style={{ marginTop: "24px" }}>
          Selected Employee: {individual.first_name} {individual.last_name}
        </h2>
      )}

      {individual && (
        <div style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2>Individual</h2>
          <Field label="ID" value={individual.id} />
          <Field label="First Name" value={individual.first_name} />
          <Field label="Last Name" value={individual.last_name} />
          <Field label="Middle Name" value={individual.middle_name} />
          <Field label="Preferred Name" value={individual.preferred_name} />
          <Field label="Date of Birth" value={individual.dob} />
          <Field label="Gender" value={individual.gender} />
          <Field label="Work Email" value={individual.emails?.find((e) => e.type === "work")?.data} />
          <Field label="Personal Email" value={individual.emails?.find((e) => e.type === "personal")?.data} />
          <Field label="Work Phone" value={individual.phone_numbers?.find((p) => p.type === "work")?.data} />
          <Field label="Personal Phone" value={individual.phone_numbers?.find((p) => p.type === "personal")?.data} />
          <Field label="Address Line 1" value={individual.residence?.line1} />
          <Field label="Address Line 2" value={individual.residence?.line2} />
          <Field label="City" value={individual.residence?.city} />
          <Field label="State" value={individual.residence?.state} />
          <Field label="Postal Code" value={individual.residence?.postal_code} />
          <Field label="Country" value={individual.residence?.country} />
          <Field label="Ethnicity" value={individual.ethnicity} />
        </div>
      )}

      {employment && (
        <div style={{ marginTop: "24px", border: "1px solid #ccc", padding: "16px" }}>
          <h2>Employment</h2>
          <Field label="Employee Number" value={employment.employee_number} />
          <Field label="Title" value={employment.title} />
          <Field label="Department" value={employment.department?.name} />
          <Field label="Manager ID" value={employment.manager?.id} />
          <Field label="Employment Type" value={employment.employment?.type} />
          <Field label="Employment Subtype" value={employment.employment?.subtype} />
          <Field label="Employment Status" value={employment.employment_status} />
          <Field label="Active" value={employment.is_active} />
          <Field label="FLSA Status" value={employment.flsa_status} />
          <Field label="Start Date" value={employment.start_date} />
          <Field label="End Date" value={employment.end_date} />
          <Field label="Latest Rehire Date" value={employment.latest_rehire_date} />
          <Field label="Class Code" value={employment.class_code} />
          <Field label="Income Amount" value={employment.income?.amount} />
          <Field label="Income Unit" value={employment.income?.unit} />
          <Field label="Currency" value={employment.income?.currency} />
          <Field label="Income Effective Date" value={employment.income?.effective_date} />
          <Field label="Location Line 1" value={employment.location?.line1} />
          <Field label="Location Line 2" value={employment.location?.line2} />
          <Field label="Location City" value={employment.location?.city} />
          <Field label="Location State" value={employment.location?.state} />
          <Field label="Location Postal Code" value={employment.location?.postal_code} />
          <Field label="Location Country" value={employment.location?.country} />
          <Field label="Source ID" value={employment.source_id} />
          <Field label="Work ID" value={employment.work_id} />
        </div>
      )}
    </div>
  );
}

function Callback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get("code");
    if (!code) return;

    const exchange = async () => {
      const res = await fetch(`${API}/api/auth/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("connectionId", data.connectionId);
        navigate("/");
        window.location.reload();
      }
    };

    exchange();
  }, [params, navigate]);

  return <div style={{ padding: "24px" }}>Finishing Finch connection...</div>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/callback" element={<Callback />} />
    </Routes>
  );
}