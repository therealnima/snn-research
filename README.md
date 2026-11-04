# Spiking Neural Networks — Interactive Literature Review

A static website summarizing ten research papers on spiking neural networks. It is a literature review: results are credited to the original authors, and the interactive demos are simplified teaching models, not reproductions of the papers' experiments.

## Structure

| Part | Chapters |
| --- | --- |
| I · The neuron | 1 LIF and circuit model · 2 Synaptic dynamics (background) · 3 PLIF, AdLIF and cAdLIF |
| II · Learning | 4 Surrogate gradients · 5 Initialization |
| III · Time | 6 Learning delays |
| IV · Efficiency | 7 Mixed timesteps, time inheritance, pruning and evolutionary search |
| Sources | 8 References |

Authors, venues, links and headline figures were rechecked against the source papers in November 2026.

## Local preview

Open this folder in VS Code and right-click `index.html` → **Open with Live Server**. Alternatively run `python -m http.server 8000` in this folder and visit http://localhost:8000/.

## GitHub Pages

Upload `index.html`, `styles.css`, `app.js` and this README to the root of your repository. In GitHub → Settings → Pages select **Deploy from a branch**, `main`, `/(root)`. No build tools are required.

Math typesetting uses MathJax from a CDN, so internet access is needed for formatted equations.

## Scope notes

The circuit is a conceptual comparator/reset model. The variance-balance equations in Chapter 5 follow Perez-Nieves and Goodman's derivation under their stated assumptions and should not be reused as universal initialization formulas.
