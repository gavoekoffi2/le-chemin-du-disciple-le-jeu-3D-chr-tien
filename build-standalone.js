// Construit KAIROS-standalone.html : le jeu complet dans UN seul fichier
// (double-cliquable, aucun serveur nécessaire).
// Usage : node build-standalone.js   (nécessite esbuild : npm i esbuild)
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

(async () => {
  const root = __dirname;
  const result = await esbuild.build({
    entryPoints: [path.join(root, 'js/main.js')],
    bundle: true,
    minify: true,
    format: 'iife',
    write: false,
    alias: { three: path.join(root, 'vendor/three.module.min.js') },
  });
  // Neutralise les séquences qui fermeraient la balise <script> une fois inliné
  const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
  const css = fs.readFileSync(path.join(root, 'css/style.css'), 'utf8');
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  // Remplacements par fonction pour éviter l'interprétation des '$' du code minifié
  html = html
    .replace(/<link rel="stylesheet" href="css\/style.css">/, () => `<style>\n${css}\n</style>`)
    .replace(/<script type="importmap">[\s\S]*?<\/script>/, '')
    .replace(/<script type="module" src="js\/main.js"><\/script>/, () => `<script>\n${js}\n</script>`);

  fs.writeFileSync(path.join(root, 'KAIROS-standalone.html'), html);
  console.log(`OK : KAIROS-standalone.html (${(html.length / 1024).toFixed(0)} Ko)`);
})();
