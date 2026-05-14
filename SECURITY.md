# 🔐 Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please open a **private** GitHub issue or contact the maintainer directly. Do **not** post sensitive details publicly.

## ⚠️ Exposed Secrets Checklist

Before pushing any code, make sure:

- [ ] `.env` is listed in `.gitignore` ✅
- [ ] No API keys appear in `main.py` or any other `.py` file
- [ ] No tokens are hardcoded in `*.ipynb` notebooks
- [ ] `generated_media/` and `uploads/` folders are git-ignored

## If You Accidentally Committed a Secret

1. **Revoke the key immediately** at the provider's dashboard.
2. Remove it from history using `git filter-repo` or BFG Repo Cleaner.
3. Force-push the cleaned history.
4. Generate a new key and store it only in `.env`.

> Rotating the key is always faster and safer than trying to scrub Git history.
