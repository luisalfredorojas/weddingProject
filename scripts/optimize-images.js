const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

async function optimizeImages() {
  console.log('🚀 Iniciando optimización de imágenes...\n');

  // Directorios a procesar
  const directories = [
    'public/assets',
    'assets'
  ];

  let totalConverted = 0;
  let totalOptimized = 0;

  for (const dir of directories) {
    const inputDir = path.join(__dirname, '..', dir);
    const outputDir = path.join(inputDir, 'optimized');
    
    if (!fsSync.existsSync(inputDir)) {
      console.log(`⚠️  Directorio ${dir} no encontrado, saltando...`);
      continue;
    }

    // Crear directorio de salida si no existe
    if (!fsSync.existsSync(outputDir)) {
      await fs.mkdir(outputDir, { recursive: true });
    }

    console.log(`📁 Procesando: ${dir}`);

    const files = await fs.readdir(inputDir);
      
    for (const file of files) {
      try {
        const ext = path.extname(file).toLowerCase();
        
        if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
          continue;
        }

        const inputPath = path.join(inputDir, file);
        const baseName = path.basename(file, ext);
        
        // Convertir a WebP
        const webpPath = path.join(outputDir, `${baseName}.webp`);
        
        // Skip if already exists (optional, but good for re-runs)
        // For now, let's overwrite or just let sharp handle it.
        
        await sharp(inputPath)
          .webp({ quality: 80 })
          .toFile(webpPath);
        
        totalConverted++;
        
        // Si es JPG, también crear versión optimizada
        if (ext === '.jpg' || ext === '.jpeg') {
          const jpgPath = path.join(outputDir, file);
          await sharp(inputPath)
            .jpeg({ quality: 85, progressive: true })
            .toFile(jpgPath);
          totalOptimized++;
        }
        
        console.log(`   ✅ ${file} → ${baseName}.webp`);
      } catch (fileError) {
        console.error(`   ❌ Error procesando archivo ${file}:`, fileError.message);
      }
    }

    console.log('');

  }

  console.log('✨ Optimización completada!');
  console.log(`\n📊 Resumen:`);
  console.log(`   - ${totalConverted} imágenes convertidas a WebP`);
  console.log(`   - ${totalOptimized} JPGs optimizados`);
  console.log(`   - Imágenes guardadas en carpetas "optimized"`);
  console.log(`\n💡 Siguiente paso: Actualizar el HTML para usar las imágenes WebP`);
}

optimizeImages().catch(console.error);
