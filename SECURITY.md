 

# Security Reporting

If you've found a security vulnerability in this project, thank you — we appreciate private, responsible reports so we can address issues before they become public. This document describes how to report security issues, what to include in a report, and how we handle reports.

## Supported reporting channels

- Primary (preferred): **GitHub Security Advisories** — submit at: https://github.com/CTU-SematX/LegoCity/security/advisories/new
- Secondary (non-urgent): Open a GitHub issue and add the label `security` (note: public issues are visible to everyone and should not contain exploit details).

If you require an encrypted channel for sensitive details, you may use the PGP key published on the maintainer's GitHub profile or contact maintainers via the GitHub Security contact; we will provide an encryption method on request via the Security Advisories flow.

## What to include in a report

Provide as much of the following as possible to help us reproduce and triage the issue:

- **Project & component**: repository URL and the component/file(s) affected
- **Versions**: software version(s), commit SHA (if applicable) and environment details
- **Vulnerability summary**: short description of the issue and impact
- **Reproduction steps**: a minimal, reproducible example (commands, scripts, or PoC) to demonstrate the issue
- **Expected vs actual behavior**: what you expected and what happened instead
- **Severity estimate**: optional CVSS score / impact assessment
- **Mitigations or suggested fixes**: optional suggested remediation

Do not include secret keys, credentials, or any sensitive personal data in an issue opened publicly.

## Our process and timelines

We follow a coordinated disclosure process. Typical timelines (may vary depending on resources and complexity):

- Acknowledgement: within 72 hours of receiving the report via Security Advisories or the security contact
- Initial triage and classification: within 7 calendar days
- Fix and release timeline: depends on severity
  - **Critical**: emergency patch / mitigation within 7 days where feasible
  - **High**: targeted patch within 14 days where feasible
  - **Medium / Low**: addressed in a future release according to maintenance schedule

We will communicate the status of the report through the Security Advisory or the reporting channel you used and coordinate any embargoed disclosure if requested.

## Scope

This policy applies to the code and configuration maintained in the `CTU-SematX/LegoCity` repository, including the `servers/`, `broker/`, and `dashboard/` components. It does not cover third-party dependencies; however, we will help triage issues that arise from or affect third-party components used by this project.

## Coordinated disclosure

We support coordinated disclosure and will work with reporters to agree on an embargo timeline. If you request an embargo, please state that in your report and provide an estimated disclosure date. We will generally aim to publish a fix and advisory before or on the agreed disclosure date.

## CVE and public advisories

When appropriate, we will request or assign CVE identifiers for confirmed vulnerabilities and publish advisories through GitHub Security Advisories and the repository's Releases/CHANGELOG.

## Contact expectations

- We will acknowledge receipt within 72 hours.
- We will provide an initial assessment within 7 days.
- We will keep the reporter informed of progress and share patches or fixes as they become available.

## Thank you

Thank you for helping improve the security of this project. Responsible security reporting helps protect users and the wider community.

---

*This document follows common open-source security reporting best practices. If you are a maintainer and want to provide a dedicated email address or PGP key for encrypted reports, add it under the "Supported reporting channels" section.*
