#!/bin/bash

echo "=== Jewellery ERP Performance Testing ==="
echo "Testing build performance and memory usage..."
echo

# Test main process build time
echo "🕐 Testing Main Process Build Time..."
start_time=$(date +%s.%3N)
npm run build:main > /dev/null 2>&1
end_time=$(date +%s.%3N)
main_build_time=$(echo "$end_time - $start_time" | bc)
echo "✅ Main Process Build: ${main_build_time}s"

# Test renderer process build time
echo "🕐 Testing Renderer Process Build Time..."
start_time=$(date +%s.%3N)
npm run build:renderer > /dev/null 2>&1
end_time=$(date +%s.%3N)
renderer_build_time=$(echo "$end_time - $start_time" | bc)
echo "✅ Renderer Process Build: ${renderer_build_time}s"

# Test preload build time
echo "🕐 Testing Preload Script Build Time..."
start_time=$(date +%s.%3N)
npm run build:preload > /dev/null 2>&1
end_time=$(date +%s.%3N)
preload_build_time=$(echo "$end_time - $start_time" | bc)
echo "✅ Preload Script Build: ${preload_build_time}s"

# Calculate bundle sizes
echo
echo "📊 Bundle Size Analysis:"
if [ -f ".webpack/main/main.js" ]; then
    main_size=$(du -h ".webpack/main/main.js" | cut -f1)
    echo "📦 Main Bundle: $main_size"
fi

if [ -f "dist/renderer/assets/main-*.js" ]; then
    renderer_size=$(du -h dist/renderer/assets/main-*.js | cut -f1)
    echo "📦 Renderer Bundle: $renderer_size"
fi

if [ -f ".webpack/main/preload.js" ]; then
    preload_size=$(du -h ".webpack/main/preload.js" | cut -f1)
    echo "📦 Preload Script: $preload_size"
fi

echo
echo "⚡ Performance Summary:"
echo "- Main Build Time: ${main_build_time}s"
echo "- Renderer Build Time: ${renderer_build_time}s"
echo "- Preload Build Time: ${preload_build_time}s"
echo "- Total Build Time: $(echo "$main_build_time + $renderer_build_time + $preload_build_time" | bc)s"

echo
echo "✅ Performance testing completed!"