# Package Reputation Heuristics Reference

This document defines the mathematical scoring model and threshold gates used to assess the risk of any newly introduced package.

---

## 1. The Package Risk Score (PRS) Formula

Every audited dependency receives a risk score from $0$ (Completely Safe) to $100$ (Critical Threat):

$$\text{PRS} = W_{\text{age}} \cdot S_{\text{age}} + W_{\text{dl}} \cdot S_{\text{dl}} + W_{\text{repo}} \cdot S_{\text{repo}} + W_{\text{hooks}} \cdot S_{\text{hooks}}$$

Where weights are calibrated to prioritize registry age and lifecycle hooks:
- $W_{\text{age}} = 0.35$ (Registry Age)
- $W_{\text{dl}} = 0.25$ (Download Volume)
- $W_{\text{repo}} = 0.20$ (Public Repository Proof)
- $W_{\text{hooks}} = 0.20$ (Install Hooks Present)

---

## 2. Component Scoring Rubric

### A. Registry Age ($S_{\text{age}}$)
- $> 365$ days: $S_{\text{age}} = 0$ (Mature, established)
- $90 - 365$ days: $S_{\text{age}} = 20$
- $30 - 90$ days: $S_{\text{age}} = 50$
- $< 30$ days: $S_{\text{age}} = 100$ (**Red Flag**: Prime window for hallucination squatting)

### B. Weekly Download Velocity ($S_{\text{dl}}$)
- $> 50,000$ downloads/wk: $S_{\text{dl}} = 0$
- $5,000 - 50,000$ downloads/wk: $S_{\text{dl}} = 15$
- $1,000 - 5,000$ downloads/wk: $S_{\text{dl}} = 40$
- $< 1,000$ downloads/wk: $S_{\text{dl}} = 85$
- $0 - 50$ downloads/wk: $S_{\text{dl}} = 100$ (**Critical Risk**)

### C. Source Code Repository ($S_{\text{repo}}$)
- Verified active GitHub/GitLab repo ($>100$ stars, multiple contributors): $S_{\text{repo}} = 0$
- Valid repo link with recent commit activity: $S_{\text{repo}} = 20$
- Repo link points to a 404 or empty dummy repo: $S_{\text{repo}} = 90$
- No repository field provided in package manifest: $S_{\text{repo}} = 100$

### D. Install Lifecycle Hooks ($S_{\text{hooks}}$)
- Zero install scripts: $S_{\text{hooks}} = 0$
- Standard build scripts without network access: $S_{\text{hooks}} = 40$
- Scripts using `curl`, `wget`, `node -e`, or base64 decoding: $S_{\text{hooks}} = 100$

---

## 3. Decision Matrix

| Overall PRS | Verdict | Enforcement Action |
| :--- | :--- | :--- |
| **$0 - 25$** | **APPROVED** | Package is established and safe to install. |
| **$26 - 55$** | **NEEDS REVIEW** | Warn developer. Verify maintainer and inspect package source before install. |
| **$56 - 75$** | **HIGH RISK** | Require explicit human override. Challenge with the 15-line YAGNI rule. |
| **$> 75$** | **BLOCKED** | Hard reject. Do not execute install. Potential hallucination or supply-chain trap. |
