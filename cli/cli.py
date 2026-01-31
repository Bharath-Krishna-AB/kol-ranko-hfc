#!/usr/bin/env python3
"""
Vulnerability Scanner
Scans project dependencies for vulnerabilities using OSV.dev and optionally Dependabot,
then analyzes them using an AI-powered risk assessment API.
"""

import json
import logging
import os
import sys
import time
import base64
import subprocess
import zlib
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from urllib.parse import urlparse, quote
import requests
from dotenv import load_dotenv

# -----------------------------
# Configuration
# -----------------------------

OSV_API_URL = "https://api.osv.dev/v1/querybatch"
ANALYZE_API_URL = os.getenv("ANALYZE_API_URL", "http://localhost:3000/api/analyze")

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# -----------------------------
# TUI Constants
# -----------------------------

class Colors:
    """ANSI color codes for terminal output."""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"

    # Colors
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    GRAY    = "\033[90m"

    # Backgrounds
    BG_RED = "\033[101m"
    BG_GREEN = "\033[102m"
    BG_YELLOW = "\033[103m"
    BG_BLUE = "\033[104m"
    BG_BLUE = "\033[105m"
    BG_CYAN = "\033[106m"


class BoxChars:
    """Box drawing characters."""
    # Double line
    TOP_LEFT = "╔"
    TOP_RIGHT = "╗"
    BOTTOM_LEFT = "╚"
    BOTTOM_RIGHT = "╝"
    HORIZONTAL = "═"
    VERTICAL = "║"

    # Single line
    S_TOP_LEFT = "┌"
    S_TOP_RIGHT = "┐"
    S_BOTTOM_LEFT = "└"
    S_BOTTOM_RIGHT = "┘"
    S_HORIZONTAL = "─"
    S_VERTICAL = "│"

    # T-junctions
    T_DOWN = "╦"
    T_UP = "╩"
    T_RIGHT = "╠"
    T_LEFT = "╣"
    CROSS = "╬"


# -----------------------------
# Data Models
# -----------------------------

@dataclass
class Dependency:
    """Represents a software dependency."""
    ecosystem: str
    name: str
    version: Optional[str] = None

    def __str__(self):
        version_str = f"@{self.version}" if self.version else ""
        return f"{self.name}{version_str} ({self.ecosystem})"


@dataclass
class DependabotAlert:
    """Cleaned Dependabot alert data."""
    package: str
    severity: str
    summary: str
    cvss_score: Optional[float]
    epss_percentage: Optional[float]
    vulnerable_range: str
    patched_version: Optional[str]
    ghsa_id: str

    @classmethod
    def from_api_response(cls, alert: Dict[str, Any]) -> "DependabotAlert":
        """Parse Dependabot API response into clean structure."""
        security = alert.get("security_advisory", {})
        dependency = alert.get("dependency", {})
        package = dependency.get("package", {})

        return cls(
            package=package.get("name", "unknown"),
            severity=security.get("severity", "unknown"),
            summary=security.get("summary", ""),
            cvss_score=security.get("cvss", {}).get("score"),
            epss_percentage=security.get("epss", {}).get("percentage"),
            vulnerable_range=dependency.get("vulnerable_version_range", ""),
            patched_version=dependency.get("patched_version"),
            ghsa_id=security.get("ghsa_id", ""),
        )


# -----------------------------
# Utilities
# -----------------------------

def step(message: str) -> None:
    """Log a step in the process with visual indicator."""
    logger.info(f"▶ {message}")
    time.sleep(0.1)


def parse_github_repo(repo_url: str) -> Tuple[str, str]:
    """Extract owner and repo name from GitHub URL."""
    parsed = urlparse(repo_url)
    parts = parsed.path.strip("/").split("/")

    if len(parts) < 2:
        raise ValueError(f"Invalid GitHub repository URL: {repo_url}")

    return parts[0], parts[1]


# -----------------------------
# TUI Utilities
# -----------------------------

class TUI:
    """Terminal User Interface utilities."""

    @staticmethod
    def box(content: str, width: int = 80, title: str = "", color: str = Colors.BLUE, double: bool = True) -> str:
        """Create a box around content."""
        if double:
            tl, tr, bl, br = BoxChars.TOP_LEFT, BoxChars.TOP_RIGHT, BoxChars.BOTTOM_LEFT, BoxChars.BOTTOM_RIGHT
            h, v = BoxChars.HORIZONTAL, BoxChars.VERTICAL
        else:
            tl, tr, bl, br = BoxChars.S_TOP_LEFT, BoxChars.S_TOP_RIGHT, BoxChars.S_BOTTOM_LEFT, BoxChars.S_BOTTOM_RIGHT
            h, v = BoxChars.S_HORIZONTAL, BoxChars.S_VERTICAL

        lines = []

        # Top border
        if title:
            title_text = f" {title} "
            padding = width - len(title_text) - 2
            left_pad = padding // 2
            right_pad = padding - left_pad
            top = f"{color}{tl}{h * left_pad}{Colors.BOLD}{title_text}{Colors.RESET}{color}{h * right_pad}{tr}{Colors.RESET}"
        else:
            top = f"{color}{tl}{h * (width - 2)}{tr}{Colors.RESET}"
        lines.append(top)

        # Content
        for line in content.split('\n'):
            # Strip ANSI codes for length calculation
            import re
            clean_line = re.sub(r'\033\[[0-9;]+m', '', line)
            padding = width - len(clean_line) - 4
            lines.append(f"{color}{v}{Colors.RESET} {line}{' ' * padding} {color}{v}{Colors.RESET}")

        # Bottom border
        bottom = f"{color}{bl}{h * (width - 2)}{br}{Colors.RESET}"
        lines.append(bottom)

        return '\n'.join(lines)

    @staticmethod
    def header(text: str, width: int = 80, char: str = "═") -> str:
        """Create a header."""
        padding = width - len(text) - 4
        left_pad = padding // 2
        right_pad = padding - left_pad
        return f"{Colors.BOLD}{Colors.BLUE}{char * left_pad} {text} {char * right_pad}{Colors.RESET}"

    @staticmethod
    def progress_bar(current: int, total: int, width: int = 40) -> str:
        """Create a progress bar."""
        filled = int(width * current / total)
        bar = "█" * filled + "░" * (width - filled)
        percentage = int(100 * current / total)
        return f"{Colors.BLUE}[{bar}]{Colors.RESET} {percentage}%"

    @staticmethod
    def severity_badge(severity: str) -> str:
        """Create a colored severity badge."""
        severity_upper = severity.upper()

        if severity_upper in ["CRITICAL", "SEVERE"]:
            return f"{Colors.BG_MAGENTA}{Colors.WHITE}{Colors.BOLD} {severity_upper} {Colors.RESET}"
        elif severity_upper == "HIGH":
            return f"{Colors.BG_RED}{Colors.BOLD} {severity_upper} {Colors.RESET}"
        elif severity_upper == "MEDIUM":
            return f"{Colors.BG_YELLOW}{Colors.WHITE} {severity_upper} {Colors.RESET}"
        elif severity_upper == "LOW":
            return f"{Colors.BG_GREEN}{Colors.BOLD} {severity_upper} {Colors.RESET}"
        else:
            return f"{Colors.BG_BLUE}{Colors.WHITE} {severity_upper} {Colors.RESET}"

    @staticmethod
    def risk_meter(score: float, max_score: float = 10.0) -> str:
        """Create a visual risk meter."""
        percentage = min(score / max_score, 1.0)
        width = 30
        filled = int(width * percentage)

        # Color based on risk level
        if percentage >= 0.7:
            color = Colors.BLUE
        elif percentage >= 0.4:
            color = Colors.RED
        else:
            color = Colors.YELLOW

        bar = "█" * filled + "░" * (width - filled)
        return f"{color}[{bar}]{Colors.RESET} {score:.1f}/{max_score}"


# -----------------------------
# Dependency Extraction
# -----------------------------

class DependencyExtractor:
    """Extract dependencies from various package manager files."""

    @staticmethod
    def extract_python_requirements(path: Path) -> List[Dependency]:
        """Extract dependencies from requirements.txt."""
        dependencies = []

        if not path.exists():
            logger.debug(f"File not found: {path}")
            return dependencies

        logger.debug(f"Parsing {path}")

        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()

            # Skip empty lines and comments
            if not line or line.startswith("#"):
                continue

            # Handle version specifiers
            for separator in ["==", ">=", "<=", "~=", ">", "<"]:
                if separator in line:
                    name, version = line.split(separator, 1)
                    dependencies.append(
                        Dependency(
                            ecosystem="PyPI",
                            name=name.strip(),
                            version=version.strip()
                        )
                    )
                    break
            else:
                # No version specifier found
                dependencies.append(
                    Dependency(ecosystem="PyPI", name=line, version=None)
                )

        return dependencies

    @staticmethod
    def extract_npm_package_json(path: Path) -> List[Dependency]:
        """Extract dependencies from package.json."""
        dependencies = []

        if not path.exists():
            logger.debug(f"File not found: {path}")
            return dependencies

        logger.debug(f"Parsing {path}")

        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse {path}: {e}")
            return dependencies

        # Extract from both dependencies and devDependencies
        for section in ("dependencies", "devDependencies"):
            for name, version in data.get(section, {}).items():
                dependencies.append(
                    Dependency(ecosystem="npm", name=name, version=version)
                )

        return dependencies

    @staticmethod
    def collect_all(workdir: Path) -> List[Dependency]:
        """Collect all dependencies from a working directory."""
        dependencies = []

        # Python
        dependencies.extend(
            DependencyExtractor.extract_python_requirements(
                workdir / "requirements.txt"
            )
        )

        # Node.js
        dependencies.extend(
            DependencyExtractor.extract_npm_package_json(
                workdir / "package.json"
            )
        )

        logger.info(f"Found {len(dependencies)} dependencies")
        return dependencies


# -----------------------------
# Vulnerability Sources
# -----------------------------

class OSVClient:
    """Client for OSV.dev API."""

    @staticmethod
    def query_vulnerabilities(dependencies: List[Dependency]) -> List[Dict[str, Any]]:
        """Query OSV.dev for vulnerabilities in given dependencies."""
        if not dependencies:
            logger.warning("No dependencies to query")
            return []

        # Build batch query
        queries = []
        for dep in dependencies:
            query = {
                "package": {
                    "ecosystem": dep.ecosystem,
                    "name": dep.name
                }
            }
            if dep.version:
                query["version"] = dep.version
            queries.append(query)

        step(f"Querying OSV.dev for {len(queries)} dependencies")

        try:
            response = requests.post(
                OSV_API_URL,
                json={"queries": queries},
                timeout=30
            )
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"OSV API request failed: {e}")
            return []

        # Extract vulnerabilities from results
        vulnerabilities = []
        results = response.json().get("results", [])

        for result in results:
            vulnerabilities.extend(result.get("vulns", []))

        logger.info(f"Found {len(vulnerabilities)} vulnerabilities from OSV")
        return vulnerabilities


class DependabotClient:
    """Client for GitHub Dependabot API."""

    def __init__(self, token: str):
        self.token = token
        self.headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
        }

    def fetch_alerts(self, owner: str, repo: str) -> List[DependabotAlert]:
        """Fetch Dependabot alerts for a repository."""
        url = f"https://api.github.com/repos/{owner}/{repo}/dependabot/alerts"

        step("Fetching Dependabot alerts")

        try:
            response = requests.get(url, headers=self.headers, timeout=30)
            response.raise_for_status()
        except requests.RequestException as e:
            logger.error(f"Dependabot API request failed: {e}")
            return []

        alerts = response.json()
        parsed_alerts = [
            DependabotAlert.from_api_response(alert)
            for alert in alerts
        ]

        logger.info(f"Found {len(parsed_alerts)} Dependabot alerts")
        return parsed_alerts


# -----------------------------
# Context Collection
# -----------------------------

class ContextCollector:
    """Collect context information from project directories."""

    @staticmethod
    def collect_context_files(root: Path) -> str:
        """
        Collect all context.md files from the repository.
        These files describe the purpose and criticality of different modules.
        """
        context_blocks = []

        for context_file in sorted(root.rglob("context.md")):
            try:
                relative_dir = context_file.parent.relative_to(root)
                content = context_file.read_text(encoding="utf-8").strip()

                if not content:
                    continue

                context_blocks.append(
                    f"### Module: {relative_dir}\n{content}"
                )

                logger.debug(f"Collected context from {relative_dir}")

            except Exception as e:
                logger.warning(f"Failed to read {context_file}: {e}")
                continue

        if context_blocks:
            logger.info(f"Collected context from {len(context_blocks)} modules")
        else:
            logger.warning("No context.md files found in repository")

        return "\n\n".join(context_blocks)


class VulnerabilityAnalyzer:
    """Analyze vulnerabilities using AI-powered API."""

    def __init__(self, api_url: str = ANALYZE_API_URL):
        self.api_url = api_url

    def analyze(
        self,
        vulnerabilities: List[Any],
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send vulnerability data and context to analysis API.

        Args:
            vulnerabilities: List of vulnerability objects (OSV, Dependabot, etc.)
            context: Optional project context describing modules and their purposes

        Returns:
            Structured risk analysis response
        """
        # Convert vulnerabilities to unstructured text format
        vuln_text = self._format_vulnerabilities_as_text(vulnerabilities)

        payload = {"text": vuln_text}

        # Add context separately if provided
        if context:
            payload["context"] = context

        step("Sending data to analysis API")
        logger.debug(f"API URL: {self.api_url}")

        try:
            response = requests.post(
                self.api_url,
                json=payload,
                timeout=120  # AI analysis can take time
            )
            response.raise_for_status()

            result = response.json()
            logger.info("Analysis completed successfully")
            return result

        except requests.RequestException as e:
            logger.error(f"Analysis API request failed: {e}")
            raise

    def _format_vulnerabilities_as_text(
        self,
        vulnerabilities: List[Any]
    ) -> str:
        """
        Convert vulnerability objects to unstructured text.
        The AI will parse this and extract structured data.
        """
        lines = []
        lines.append("VULNERABILITY SCAN RESULTS\n")
        lines.append("=" * 50)
        lines.append("")

        for vuln in vulnerabilities:
            if isinstance(vuln, DependabotAlert):
                lines.append(f"Package: {vuln.package}")
                lines.append(f"Severity: {vuln.severity}")
                lines.append(f"ID: {vuln.ghsa_id}")
                lines.append(f"Summary: {vuln.summary}")
                lines.append(f"Vulnerable Range: {vuln.vulnerable_range}")
                if vuln.patched_version:
                    lines.append(f"Patched Version: {vuln.patched_version}")
                if vuln.cvss_score:
                    lines.append(f"CVSS Score: {vuln.cvss_score}")
                lines.append("")

            elif isinstance(vuln, dict):
                # OSV format
                lines.append(f"ID: {vuln.get('id', 'unknown')}")
                lines.append(f"Summary: {vuln.get('summary', '')}")

                if 'affected' in vuln:
                    for affected in vuln['affected']:
                        pkg = affected.get('package', {})
                        lines.append(f"Package: {pkg.get('name')} ({pkg.get('ecosystem')})")

                if 'severity' in vuln:
                    for sev in vuln.get('severity', []):
                        lines.append(f"Severity: {sev.get('type')} - {sev.get('score')}")

                lines.append(f"Details: {vuln.get('details', '')[:200]}")
                lines.append("")

        return "\n".join(lines)

# -----------------------------
# URL Encoding
# -----------------------------

def encode_results_to_url(results: Dict[str, Any], base_url: str = "http://localhost:3000/signin") -> str:
    """
    Encode results into a compressed, URL-safe format.
    Uses zlib compression + base64 encoding for optimal size.
    """
    # Convert to JSON
    json_str = json.dumps(results, separators=(',', ':'))  # Compact JSON

    # Compress with zlib
    compressed = zlib.compress(json_str.encode('utf-8'), level=9)

    # Encode to base64 (URL-safe variant)
    encoded = base64.urlsafe_b64encode(compressed).decode('ascii')

    # Remove padding to save space (can be restored on decode)
    encoded = encoded.rstrip('=')

    # Build URL
    url = f"{base_url}?data={quote(encoded)}"

    return url

# -----------------------------
# Pretty Output
# -----------------------------

class ResultsPrinter:
    """Pretty print analysis results with TUI."""

    @staticmethod
    def print_results(results: Dict[str, Any], workdir: Path):
        """Print formatted results to console."""
        print("\n")

        # Banner
        banner = """
 ██╗  ██╗ ██████╗ ██╗     ██████╗  █████╗ ███╗   ██╗ ██╗  ██╗ ██████╗
 ██║ ██╔╝██╔═══██╗██║     ██╔══██╗██╔══██╗████╗  ██║ ██║ ██╔╝██╔═══██╗
 █████╔╝ ██║   ██║██║     ██████╔╝███████║██╔██╗ ██║ █████╔╝ ██║   ██║
 ██╔═██╗ ██║   ██║██║     ██╔══██╗██╔══██║██║╚██╗██║ ██╔═██╗ ██║   ██║
 ██║  ██╗╚██████╔╝███████╗██║  ██║██║  ██║██║ ╚████║ ██║  ██╗╚██████╔╝
 ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═╝  ╚═╝ ╚═════╝
        """
        print(f"{Colors.CYAN}{banner}{Colors.RESET}")

        # Project info
        print(TUI.header("PROJECT INFORMATION", width=100))
        project_info = f"""
{Colors.BOLD}Directory:{Colors.RESET} {workdir}
{Colors.BOLD}Scan Time:{Colors.RESET} {time.strftime('%Y-%m-%d %H:%M:%S')}
        """.strip()
        print(TUI.box(project_info, width=100, color=Colors.BLUE, double=False))
        print()

        # Risk Summary
        if "aggregate_risk" in results:
            ResultsPrinter._print_risk_summary(results["aggregate_risk"])

        # Vulnerabilities
        if "vulnerabilities" in results:
            ResultsPrinter._print_vulnerabilities(results["vulnerabilities"])

        # Recommendations
        if "recommendations" in results:
            ResultsPrinter._print_recommendations(results["recommendations"])

    @staticmethod
    def _print_risk_summary(risk: Dict[str, Any]):
        """Print risk summary section."""
        print(TUI.header("RISK ASSESSMENT", width=100))

        risk_level = risk.get("risk_level", "unknown").upper()
        risk_score = risk.get("risk_score", 0)
        tte_days = risk.get("time_to_exploit_estimate_days", 0)

        # Color the risk level
        if risk_level in ["CRITICAL", "SEVERE"]:
            level_color = Colors.MAGENTA
        elif risk_level == "HIGH":
            level_color = Colors.RED
        elif risk_level == "MEDIUM":
            level_color = Colors.YELLOW
        else:
            level_color = Colors.GREEN

        summary = f"""
{Colors.BOLD}Overall Risk Level:{Colors.RESET} {level_color}{Colors.BOLD}{risk_level}{Colors.RESET}

{Colors.BOLD}Risk Score:{Colors.RESET}
{TUI.risk_meter(risk_score, 10.0)}

{Colors.BOLD}Time to Exploit (Est.):{Colors.RESET} {Colors.YELLOW}{tte_days} days{Colors.RESET}

{Colors.BOLD}Reasoning:{Colors.RESET}
{risk.get('reasoning', 'No reasoning provided.')}
        """.strip()

        print(TUI.box(summary, width=100, color=level_color, double=True))
        print()

    @staticmethod
    def _print_vulnerabilities(vulnerabilities: List[Dict[str, Any]]):
        """Print vulnerabilities section."""
        if not vulnerabilities:
            return

        count = len(vulnerabilities)
        print(TUI.header(f"VULNERABILITIES ({count if count <= 10 else '10+'})", width=100))

        for i, vuln in enumerate(vulnerabilities[:10], 1):
            severity = vuln.get("severity", {})
            severity_label = severity.get("severity_label", "unknown")
            base_score = severity.get("base_score", "N/A")

            affected = vuln.get("affected_component", {})
            package = affected.get("package", "unknown")
            version_range = affected.get("version_range", "unknown")

            classification = vuln.get("classification", {})
            category = classification.get("category", "other")
            cwe = ", ".join(classification.get("cwe", [])) or "N/A"

            exploitability = vuln.get("exploitability", {})
            known_exploits = exploitability.get("known_exploits", False)
            exploit_maturity = exploitability.get("exploit_maturity", "none")

            impact = vuln.get("impact", {})
            data_risk = ", ".join(impact.get("data_types_at_risk", [])) or "none"
            customer_impact = impact.get("customer_impact", "N/A")

            recommendations = vuln.get("recommendations", {})
            actions = recommendations.get("actions", [])

            vuln_content = f"""
{Colors.BOLD}#{i} {TUI.severity_badge(severity_label)}{Colors.RESET}

{Colors.BOLD}Package:{Colors.RESET} {Colors.BLUE}{package}{Colors.RESET}
{Colors.BOLD}Affected Versions:{Colors.RESET} {version_range}

{Colors.BOLD}Category:{Colors.RESET} {category}
{Colors.BOLD}CWE:{Colors.RESET} {cwe}

{Colors.BOLD}Base Score:{Colors.RESET} {base_score}
{Colors.BOLD}Known Exploits:{Colors.RESET} {known_exploits} ({exploit_maturity})

{Colors.BOLD}Data at Risk:{Colors.RESET} {data_risk}
{Colors.BOLD}Customer Impact:{Colors.RESET} {customer_impact}

{Colors.BOLD}Recommended Actions:{Colors.RESET}
- """ + "\n- ".join(actions[:5]) if actions else "None"
            vuln_content = vuln_content.strip()

            print(TUI.box(vuln_content, width=100, color=Colors.GRAY, double=False))
            print()

    @staticmethod
    def _print_recommendations(recommendations: List[str]):
        """Print recommendations section."""
        if not recommendations:
            return

        print(TUI.header("RECOMMENDATIONS", width=100))

        rec_text = ""
        for i, rec in enumerate(recommendations, 1):
            rec_text += f"{Colors.BLUE}▸{Colors.RESET} {rec}\n"

        print(TUI.box(rec_text.strip(), width=100, title="Action Items", color=Colors.GREEN, double=False))
        print()


# -----------------------------
# Main Orchestrator
# -----------------------------

class VulnerabilityScanner:
    """Main orchestrator for the vulnerability scanning process."""

    def __init__(self, workdir: Path):
        self.workdir = workdir
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from environment variables."""
        load_dotenv(self.workdir / ".env")

        return {
            "use_dependabot": os.getenv("USE_DEPENDABOT", "false").lower() == "true",
            "github_repo_url": os.getenv("GITHUB_REPO_URL"),
            "github_token": os.getenv("GITHUB_PAT"),
            "api_url": os.getenv("ANALYZE_API_URL", ANALYZE_API_URL),
        }

    def run(self) -> Dict[str, Any]:
        """Execute the complete vulnerability scanning workflow."""
        step("Starting vulnerability scan")

        # 1. Collect dependencies
        dependencies = DependencyExtractor.collect_all(self.workdir)

        if not dependencies:
            logger.warning("No dependencies found to scan")
            return {"error": "No dependencies found"}

        # 2. Query OSV for vulnerabilities
        osv_vulns = OSVClient.query_vulnerabilities(dependencies)
        all_vulnerabilities = osv_vulns

        # 3. Optionally fetch Dependabot alerts
        if self.config["use_dependabot"]:
            if not self.config["github_repo_url"] or not self.config["github_token"]:
                logger.warning(
                    "USE_DEPENDABOT is true but GITHUB_REPO_URL or GITHUB_PAT not set"
                )
            else:
                try:
                    owner, repo = parse_github_repo(self.config["github_repo_url"])
                    client = DependabotClient(self.config["github_token"])
                    dependabot_alerts = client.fetch_alerts(owner, repo)
                    all_vulnerabilities.extend(dependabot_alerts)
                except Exception as e:
                    logger.error(f"Failed to fetch Dependabot alerts: {e}")

        # 4. Collect project context
        context = ContextCollector.collect_context_files(self.workdir)

        # 5. Analyze with AI (sending context separately)
        analyzer = VulnerabilityAnalyzer(self.config["api_url"])
        analysis_result = analyzer.analyze(
            vulnerabilities=all_vulnerabilities,
            context=context if context else None
        )

        return analysis_result

    def save_results(self, results: Dict[str, Any], output_path: Path) -> None:
        """Save analysis results to file."""
        output_path.write_text(
            json.dumps(results, indent=2, ensure_ascii=False),
            encoding="utf-8"
        )
        step(f"Results saved to {output_path}")


# -----------------------------
# Agent
# -----------------------------

AGENT_SYSTEM_PROMPT = """
You are a dependency-fixing assistant.

Goal:
Fix the given vulnerability by upgrading or adjusting dependencies.

Rules:
- Output ONLY one shell command at a time
- No explanations
- Prefer minimal changes
- Stop when the vulnerability is fixed
- If no safe action exists, output: STOP
"""

def agent_next_command(messages: List[Dict[str, str]]) -> str:
    resp = requests.post(
        ANALYZE_API_URL,
        json={"messages": messages},
        timeout=60
    )
    resp.raise_for_status()
    return resp.json()["command"].strip()

def run_fix_agent(fix: Dict[str, Any]):
    messages = [
        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
        {"role": "user", "content": json.dumps(fix, indent=2)}
    ]

    while True:
        cmd = agent_next_command(messages)

        if cmd == "STOP":
            break

        if not is_command_safe(cmd):
            print(f"\nRejected unsafe command:\n  {cmd}")
            messages.append({
                "role": "user",
                "content": "Command rejected: unsafe operation."
            })
            continue

        print(f"\nProposed command:\n  {cmd}")
        approve = input("Run this command? (y/n): ").strip().lower()

        if approve != "y":
            messages.append({
                "role": "user",
                "content": "Command rejected by user."
            })
            continue

        try:
            proc = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True
            )
            output = proc.stdout + proc.stderr
        except Exception as e:
            output = str(e)

        messages.append({"role": "assistant", "content": cmd})
        messages.append({"role": "user", "content": output})

def seed_fix_context(fix):
    if fix["ecosystem"] == "npm":
        return f"Use npm. Prefer: npm install {fix['package']}@{fix['patched_version']}"
    if fix["ecosystem"] == "PyPI":
        return f"Use pip. Prefer: pip install -U {fix['package']}"
    return ""

DANGEROUS_TOKENS = [
    "rm ", "rm -", "sudo", "curl | sh", "wget | sh",
    "mkfs", "dd ", ":(){", "shutdown", "reboot"
]

def is_command_safe(cmd: str) -> bool:
    lowered = cmd.lower()
    return not any(token in lowered for token in DANGEROUS_TOKENS)

# -----------------------------
# CLI Entry Point
# -----------------------------

def main():
    """Main entry point for CLI."""
    if len(sys.argv) < 2:
        print("Usage: vulnerability_scanner.py <project_directory>", file=sys.stderr)
        print("\nEnvironment variables:")
        print("  USE_DEPENDABOT=true|false    - Enable Dependabot integration")
        print("  GITHUB_REPO_URL=<url>        - GitHub repository URL")
        print("  GITHUB_PAT=<token>           - GitHub Personal Access Token")
        print("  ANALYZE_API_URL=<url>        - Analysis API endpoint")
        sys.exit(1)

    workdir = Path(sys.argv[1]).resolve()

    if not workdir.exists():
        logger.error(f"Directory does not exist: {workdir}")
        sys.exit(1)

    if not workdir.is_dir():
        logger.error(f"Not a directory: {workdir}")
        sys.exit(1)

    # Change to working directory
    os.chdir(workdir)

    try:
        # Run the scanner
        scanner = VulnerabilityScanner(workdir)
        results = scanner.run()

        # Save results
        output_file = workdir / "vulnerability_analysis.json"
        scanner.save_results(results, output_file)

        # Pretty print results
        ResultsPrinter.print_results(results, workdir)

        # Generate encoded URL
        encoded_url = encode_results_to_url(results)

        print(TUI.header("ENCODED RESULTS URL", width=100))
        url_box = f"""
{Colors.BOLD}View full results in browser:{Colors.RESET}

{Colors.BLUE}{encoded_url}{Colors.RESET}

{Colors.DIM}Note: URL contains compressed, base64-encoded scan results{Colors.RESET}
        """.strip()
        print(TUI.box(url_box, width=100, color=Colors.BLUE, double=False))
        print()

        step("✓ Scan complete")

        # here

    except Exception as e:
        logger.error(f"{Colors.RED} Scan failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()