# ECR & ECN Management

GitHub Pages-ready static web application.

## Important GitHub Pages setup
1. Upload the **contents of this folder** to the root of your repository (not the ZIP itself).
2. Make sure the entry file is exactly `index.html` (lowercase).
3. GitHub → Repository → Settings → Pages.
4. Under Build and deployment, select **Deploy from a branch**.
5. Select `main` (or your branch) and folder `/ (root)`, then Save.
6. Wait a few minutes and open the URL shown by GitHub Pages.

GitHub Pages is case-sensitive, so `Index.html` will not work as the entry file.

## Local data
The static version stores working data in browser localStorage. It also supports downloading updated XLSX/CSV reports. The client-side admin credentials are demo credentials only and are not suitable for production security.
