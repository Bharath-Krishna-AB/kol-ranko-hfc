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
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Optional, Tuple, Dict, Any
from urllib.parse import urlparse

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


# -----------------------------
# AI Analysis
# -----------------------------

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
        
        step("✓ Scan complete")
        
        # Print summary
        if "aggregate_risk" in results:
            risk = results["aggregate_risk"]
            print("\n" + "=" * 50)
            print("SUMMARY")
            print("=" * 50)
            print(f"Risk Level: {risk.get('risk_level', 'unknown').upper()}")
            print(f"Risk Score: {risk.get('risk_score', 0):.1f}/10")
            print(f"Vulnerabilities Found: {len(results.get('vulnerabilities', []))}")
            print(f"Time to Exploit (est.): {risk.get('time_to_exploit_estimate_days', 0)} days")
            print("=" * 50)
        
    except Exception as e:
        logger.error(f"Scan failed: {e}", exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()