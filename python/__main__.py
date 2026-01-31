#!/usr/bin/env python3

import os
import sys
import time
import json
from pathlib import Path
from urllib.parse import urlparse
import requests
from dotenv import load_dotenv
from openai import OpenAI

OSV_API_URL = "https://api.osv.dev/v1/querybatch"

# -----------------------------
# Utils
# -----------------------------

def step(msg):
    print(f"[>] {msg}")
    time.sleep(0.15)

def parse_repo(repo_url: str):
    parsed = urlparse(repo_url)
    parts = parsed.path.strip("/").split("/")
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL")
    return parts[0], parts[1]

# -----------------------------
# Dependency extractors
# -----------------------------

def extract_python_requirements(path: Path):
    deps = []
    if not path.exists():
        return deps

    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for sep in ["==", ">=", "<=", "~=", ">", "<"]:
            if sep in line:
                name, version = line.split(sep, 1)
                deps.append(("PyPI", name.strip(), version.strip()))
                break
        else:
            deps.append(("PyPI", line, None))
    return deps

def extract_npm_package_json(path: Path):
    deps = []
    if not path.exists():
        return deps

    data = json.loads(path.read_text())
    for section in ("dependencies", "devDependencies"):
        for name, version in data.get(section, {}).items():
            deps.append(("npm", name, version))
    return deps

def collect_dependencies(workdir: Path):
    deps = []
    deps += extract_python_requirements(workdir / "requirements.txt")
    deps += extract_npm_package_json(workdir / "package.json")
    return deps

# -----------------------------
# OSV
# -----------------------------

def query_osv(dependencies):
    if not dependencies:
        return []

    queries = []
    for ecosystem, name, version in dependencies:
        q = {"package": {"ecosystem": ecosystem, "name": name}}
        if version:
            q["version"] = version
        queries.append(q)

    step(f"Querying OSV ({len(queries)} deps)")
    r = requests.post(OSV_API_URL, json={"queries": queries})
    if r.status_code != 200:
        raise RuntimeError(r.text)

    vulns = []
    for res in r.json().get("results", []):
        vulns.extend(res.get("vulns", []))
    return vulns

# -----------------------------
# Dependabot
# -----------------------------

def fetch_dependabot_alerts(owner, repo, token):
    url = f"https://api.github.com/repos/{owner}/{repo}/dependabot/alerts"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json",
    }
    step("Fetching Dependabot alerts")
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        raise RuntimeError(r.text)
    return r.json()

def clean_dependabot_alert(alert):
    sec = alert.get("security_advisory", {})
    dep = alert.get("dependency", {})
    pkg = dep.get("package", {})

    return {
        "package": pkg.get("name"),
        "severity": sec.get("severity"),
        "summary": sec.get("summary"),
        "cvss": sec.get("cvss", {}).get("score"),
        "epss": sec.get("epss", {}).get("percentage"),
        "range": dep.get("vulnerable_version_range"),
        "patched": dep.get("patched_version"),
        "id": sec.get("ghsa_id"),
    }

# -----------------------------
# Context collection
# -----------------------------

def collect_context_md(root: Path) -> str:
    blocks = []

    for path in sorted(root.rglob("context.md")):
        rel_dir = path.parent.relative_to(root)
        content = path.read_text().strip()
        if not content:
            continue

        blocks.append(
            f"### Directory: {rel_dir}\n{content}"
        )

    return "\n\n".join(blocks)

# -----------------------------
# Prompt construction
# -----------------------------

def build_prompt(context: str, alerts: list) -> str:
    alerts_json = json.dumps(alerts, indent=2)
    return alerts_json

    return """
SYSTEM:
You are a security risk analysis engine. Your role is to analyze software vulnerability data in context and produce structured, information-dense risk intelligence suitable for direct rendering in a web UI.

OUTPUT_SCHEMA:
{
  "generated_at": string,
  "aggregate_risk": {
    "risk_score": 0.0,
    "risk_level": "low | medium | high | critical",
    "blast_radius": 0,
    "exploit_likelihood": 0,
    "impact_potential": 0,
    "time_to_exploit_estimate_days": 0,
    "dominant_risk_factors": ["string"]
  },
  "vulnerabilities": [
    {
      "source": "OSV | NVD | advisory | custom",
      "classification": {
        "cwe": ["string"],
        "category": "injection | auth | crypto | supply-chain | logic | config | memory | other"
      },
      "affected_component": {
        "package": "string",
        "version_range": "string",
      },
      "severity": {
        "base_score": 0.0,
        "severity_label": "low | medium | high | critical",
      },
      "exploitability": {
        "known_exploits": bool,
        "exploit_maturity": "none | poc | weaponized | in-the-wild",
        "attack_complexity": 0,
        "attack_prerequisites": ["string"]
      },
      "impact": {
        "confidentiality": 0,
        "integrity": 0,
        "availability": 0,
        "data_types_at_risk": ["pii | auth | financial | internal | none"],
        "customer_impact": 0
      },
      "recommendations": {
        "priority": 0,
        "actions": ["string"],
        "short_term_mitigation": ["string"],
        "long_term_fix": ["string"]
      },
    }
  ],
  "action_plan": {
    "immediate": ["string"],
    "near_term": ["string"],
    "long_term": ["string"],
    "estimated_total_effort_hours": 0
  }
}

INSTRUCTIONS:
1. Ingest unstructured or semi-structured JSON vulnerability data and repository context.
2. Normalize inconsistent fields, infer missing values, and resolve conflicts.
3. Evaluate each vulnerability for reachability, exploitability, and impact.
4. Adjust severity using repository exposure, environment, and business context.
5. Compute aggregate and per-vulnerability risk scores.
6. Explicitly list assumptions and data gaps.
7. Decompose results into small, composable units suitable for dense UI rendering.

RULES:
- Output MUST strictly conform to OUTPUT_SCHEMA.
- Do not add or remove keys.
- Use empty arrays instead of null where possible.
- If data is missing, estimate conservatively and reduce confidence.
- Separate raw severity from context-adjusted risk.
- All numeric scores must be in the range 0–10 unless otherwise specified.
- No prose or commentary outside the JSON output.

SCORING GUIDANCE:
- Risk score = weighted function of severity, exploitability, reachability, exposure, and business criticality.
- Production, public-facing, authentication or data-path issues increase impact.
- Known exploits and low attack complexity increase exploit likelihood.
- Indirect or unreachable dependencies reduce final risk.

INPUT:

""" + alerts_json

# -----------------------------
# Hugging Face
# -----------------------------

def query_huggingface(prompt: str):
    response = requests.post(
        "http://localhost:3000/api/llm",
        json={
            "prompt": prompt
        }
    )
    
    response.raise_for_status()
    print(response.text)
    return response.json()

# -----------------------------
# Main
# -----------------------------

def main():
    if len(sys.argv) < 2:
        print("Usage: script.py <workdir>", file=sys.stderr)
        sys.exit(1)

    workdir = Path(sys.argv[1]).resolve()
    os.chdir(workdir)
    load_dotenv(workdir / ".env")

    use_dependabot = os.getenv("USE_DEPENDABOT", "false") == "true"
    repo_url = os.getenv("GITHUB_REPO_URL")
    gh_token = os.getenv("GITHUB_PAT")

    # hf_token = os.getenv("HF_API_TOKEN")
    # hf_model_url = os.getenv("HF_MODEL_URL")
    # openai_api_key = os.getenv("OPENAI_API_KEY")
    # client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    step("Collecting dependencies")
    deps = collect_dependencies(workdir)

    alerts = query_osv(deps)

    if use_dependabot:
        owner, repo = parse_repo(repo_url)
        db = fetch_dependabot_alerts(owner, repo, gh_token)
        alerts += [clean_dependabot_alert(a) for a in db]

    step("Collecting context.md files")
    context = collect_context_md(workdir)

    prompt = build_prompt(context, alerts)

    hf_response = query_huggingface(prompt)

    # Path("output.json").write_text(prompt)
    Path("output.json").write_text(json.dumps(hf_response, indent=2))
    step("Done")

if __name__ == "__main__":
    main()
