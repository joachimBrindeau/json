#!/usr/bin/env node

/**
 * Verification script for flow diagram refactoring
 * Checks that all files are in place and imports are correct
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 FLOW DIAGRAM REFACTORING VERIFICATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

let passed = 0;
let failed = 0;

function check(description, condition) {
  if (condition) {
    console.log(`✅ ${description}`);
    passed++;
  } else {
    console.log(`❌ ${description}`);
    failed++;
  }
}

// Check directory structure
console.log('📁 Directory Structure:');
check(
  'flow/ directory exists',
  fs.existsSync(path.join(rootDir, 'components/features/viewer/flow'))
);
check(
  'flow/nodes/ directory exists',
  fs.existsSync(path.join(rootDir, 'components/features/viewer/flow/nodes'))
);
check(
  'flow/edges/ directory exists',
  fs.existsSync(path.join(rootDir, 'components/features/viewer/flow/edges'))
);
check(
  'flow/utils/ directory exists',
  fs.existsSync(path.join(rootDir, 'components/features/viewer/flow/utils'))
);
check(
  'Old flow-diagram/ directory removed',
  !fs.existsSync(path.join(rootDir, 'components/features/flow-diagram'))
);

console.log('');
console.log('📄 Main Files:');
const mainFiles = [
  'components/features/viewer/flow/index.ts',
  'components/features/viewer/flow/FlowView.tsx',
  'components/features/viewer/flow/FlowDiagram.tsx',
  'components/features/viewer/flow/FlowChainHandle.tsx',
  'components/features/viewer/flow/FlowDefaultHandle.tsx',
  'components/features/viewer/flow/FlowHoveringDot.tsx',
  'components/features/viewer/flow/README.md',
];

mainFiles.forEach(file => {
  check(file, fs.existsSync(path.join(rootDir, file)));
});

console.log('');
console.log('🔷 Node Files:');
const nodeFiles = [
  'components/features/viewer/flow/nodes/FlowArrayNode.tsx',
  'components/features/viewer/flow/nodes/FlowObjectNode.tsx',
  'components/features/viewer/flow/nodes/FlowPrimitiveNode.tsx',
  'components/features/viewer/flow/nodes/FlowBooleanChip.tsx',
  'components/features/viewer/flow/nodes/FlowNullChip.tsx',
  'components/features/viewer/flow/nodes/FlowNodeShell.tsx',
  'components/features/viewer/flow/nodes/FlowObjectNodeProperty.tsx',
];

nodeFiles.forEach(file => {
  check(path.basename(file), fs.existsSync(path.join(rootDir, file)));
});

console.log('');
console.log('🔗 Edge Files:');
const edgeFiles = [
  'components/features/viewer/flow/edges/FlowChainEdge.tsx',
  'components/features/viewer/flow/edges/FlowDefaultEdge.tsx',
];

edgeFiles.forEach(file => {
  check(path.basename(file), fs.existsSync(path.join(rootDir, file)));
});

console.log('');
console.log('🛠️  Utility Files:');
const utilFiles = [
  'components/features/viewer/flow/utils/flow-constants.ts',
  'components/features/viewer/flow/utils/flow-layout.ts',
  'components/features/viewer/flow/utils/flow-parser.ts',
  'components/features/viewer/flow/utils/flow-types.ts',
  'components/features/viewer/flow/utils/flow-utils.ts',
];

utilFiles.forEach(file => {
  check(path.basename(file), fs.existsSync(path.join(rootDir, file)));
});

console.log('');
console.log('📦 Exports:');
const indexPath = path.join(rootDir, 'components/features/viewer/flow/index.ts');
if (fs.existsSync(indexPath)) {
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  check('FlowView exported', indexContent.includes('export { FlowView'));
  check('FlowDiagram exported', indexContent.includes('export { FlowDiagram'));
  check('FlowArrayNode exported', indexContent.includes('export { FlowArrayNode'));
  check('FlowObjectNode exported', indexContent.includes('export { FlowObjectNode'));
  check('Backwards compatibility (JsonFlowView)', indexContent.includes('JsonFlowView'));
  check('Backwards compatibility (ArrayNode)', indexContent.includes('ArrayNode'));
}

console.log('');
console.log('🔌 Imports:');
const viewerFlowPath = path.join(rootDir, 'components/features/viewer/ViewerFlow.tsx');
if (fs.existsSync(viewerFlowPath)) {
  const viewerFlowContent = fs.readFileSync(viewerFlowPath, 'utf8');
  check(
    'ViewerFlow.tsx imports from ./flow/FlowView',
    viewerFlowContent.includes('./flow/FlowView')
  );
  check(
    'ViewerFlow.tsx uses FlowView component',
    viewerFlowContent.includes('<FlowView')
  );
  check(
    'ViewerFlow.tsx does not import from old path',
    !viewerFlowContent.includes('flow-diagram')
  );
}

console.log('');
console.log('📚 Documentation:');
check(
  'flow/README.md exists',
  fs.existsSync(path.join(rootDir, 'components/features/viewer/flow/README.md'))
);
check(
  'Refactoring summary exists',
  fs.existsSync(path.join(rootDir, 'docs/refactoring/flow-diagram-refactoring-complete.md'))
);

console.log('');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RESULTS:');
console.log(`   ✅ Passed: ${passed}`);
console.log(`   ❌ Failed: ${failed}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (failed === 0) {
  console.log('');
  console.log('🎉 All checks passed! Flow diagram refactoring is complete.');
  console.log('');
  process.exit(0);
} else {
  console.log('');
  console.log('⚠️  Some checks failed. Please review the output above.');
  console.log('');
  process.exit(1);
}

