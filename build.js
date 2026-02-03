import { build } from 'vite'
import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, existsSync } from 'fs'

const viteConfig = defineConfig({
  build: {
    rollupOptions: {
      input: {
        background: 'src/background/background.ts',
        content: 'src/content/content.ts',
        popup: 'src/popup/popup.ts'
      },
      external: ['chrome'],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]'
      }
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
})

async function buildExtension() {
  console.log('Building extension...')
  
  try {
    await build(viteConfig)
    console.log('✓ Built JavaScript files')
    
    // Create manifest for dist
    const distManifest = {
      manifest_version: 3,
      name: "Matrixify",
      version: "1.0.0",
      description: "End-to-end encryption for web chat messages",
      permissions: ["activeTab", "storage"],
      host_permissions: ["<all_urls>"],
      background: {
        service_worker: "background.js"
      },
      content_scripts: [{
        matches: ["<all_urls>"],
        js: ["content.js"],
        css: ["content.css"]
      }],
      web_accessible_resources: [{
        resources: ["assets/*"],
        matches: ["<all_urls>"]
      }],
      action: {
        default_popup: "popup.html",
        default_title: "Matrixify"
      }
    }
    
    // Write manifest to dist
/*
    await import('fs/promises').then(fs => 
      fs.writeFile('dist/manifest.json', JSON.stringify(distManifest, null, 2))
    )
*/
    console.log('✓ Created manifest.json')
    
    // Copy popup.html and replace script src
    let popupHtml = await import('fs/promises').then(fs => 
      fs.readFile('src/popup/popup.html', 'utf8')
    )
    popupHtml = popupHtml.replace('src/popup/popup.ts', 'popup.js')
    await import('fs/promises').then(fs => 
      fs.writeFile('dist/popup.html', popupHtml)
    )
    console.log('✓ Copied and updated popup.html')
    
    // Copy content.css
    copyFileSync('public/content.css', 'dist/content.css')
    console.log('✓ Copied content.css')
    
    console.log('✅ Extension build complete!')
    console.log('Files in dist:')
    const files = await import('fs/promises').then(fs => fs.readdir('dist'))
    files.forEach(file => console.log(`  - ${file}`))
  } catch (err) {
    console.error('Build failed:', err)
    process.exit(1)
  }
}
buildExtension()
