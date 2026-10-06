# Raw & Real — website

## Put it on GitHub Pages
1. Create a repository (public) and upload **all the files in this folder** so that `index.html` is at the root of the repo.
2. Settings → Pages → Source: *Deploy from a branch* → Branch `main`, folder `/ (root)` → Save.
3. Wait 1–2 min → site is at `https://USERNAME.github.io/REPO-NAME/`

## Receive orders (no database)
GitHub has no form service, so:
- open `js/app.js`, line 6 → paste a free Formspree endpoint in `FORM_ENDPOINT` → every order arrives by email.
- The `/admin.html` page (password `rawreal2026`) also lists orders placed from the same browser.

## Customize
Price / texts / sizes → `js/app.js` (PRODUCTS) · Admin password → `admin.html` · Photos → `img/`
