---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: bug
assignees: ''

---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Make API call to '...'
2. With payload '....'
3. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**API Request Example**
```bash
curl -X POST "http://localhost:8000/api/writing/score" \
  -H "Content-Type: application/json" \
  -d '{"essay": "..."}'
```

**Error Response**
```json
{
  "error": "..."
}
```

**Environment (please complete the following information):**
 - OS: [e.g. Ubuntu 22.04, Windows 11, macOS]
 - Docker Version: [e.g. 24.0.7]
 - Python Version: [e.g. 3.11.5]
 - Deployment Method: [Docker/Local/Cloud]

**Logs**
```
Paste relevant logs here
```

**Additional context**
Add any other context about the problem here.
