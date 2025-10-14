// Web Worker for JSON processing and flow generation
self.onmessage = function (e) {
  const { type, payload, config } = e.data;

  switch (type) {
    case 'parse':
      try {
        const start = performance.now();
        const parsed = JSON.parse(payload);
        const end = performance.now();

        self.postMessage({
          type: 'parse-success',
          data: parsed,
          stats: {
            parseTime: end - start,
            size: payload.length,
            keys: Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length,
          },
        });
      } catch (error) {
        self.postMessage({
          type: 'parse-error',
          error: error.message,
        });
      }
      break;

    case 'stringify':
      try {
        const start = performance.now();
        const stringified = JSON.stringify(payload, null, 2);
        const end = performance.now();

        self.postMessage({
          type: 'stringify-success',
          data: stringified,
          stats: {
            stringifyTime: end - start,
            size: stringified.length,
          },
        });
      } catch (error) {
        self.postMessage({
          type: 'stringify-error',
          error: error.message,
        });
      }
      break;

    case 'analyze':
      try {
        const parsed = JSON.parse(payload);
        const stats = analyzeJson(parsed);

        self.postMessage({
          type: 'analyze-success',
          stats,
        });
      } catch (error) {
        self.postMessage({
          type: 'analyze-error',
          error: error.message,
        });
      }
      break;

    case 'validate':
      try {
        JSON.parse(payload);
        self.postMessage({
          type: 'validate-success',
          valid: true,
        });
      } catch (error) {
        // Find line and column of error
        const match = error.message.match(/position (\d+)/);
        const position = match ? parseInt(match[1]) : 0;

        self.postMessage({
          type: 'validate-error',
          valid: false,
          error: error.message,
          position,
        });
      }
      break;

    case 'generate-flow':
      generateFlowNodes(payload, config);
      break;

    case 'filter-viewport':
      filterViewportNodes(payload, config);
      break;
  }
};

// Generate flow nodes for massive JSON visualization
// Config values come from VIEWER_CONFIG.worker (lib/config/viewer-config.ts)
// and are passed via postMessage from the calling code
function generateFlowNodes(jsonString, config = {}) {
  const {
    maxDepth = 10,
    maxNodesPerLevel = 100,
    enableClustering = true,
    clusterSize = 50,
    chunkSize = 500,
    maxTotalNodes = 10000, // See VIEWER_CONFIG.worker.maxTotalNodes
  } = config;

  try {
    const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    const result = {
      nodes: [],
      edges: [],
      clusters: [],
      stats: {
        totalNodes: 0,
        totalEdges: 0,
        maxDepth: 0,
        truncated: false,
        processedNodes: 0,
      },
    };

    let nodeId = 0;
    const levelCounts = new Map();
    const nodeQueue = [];
    const processedPaths = new Set();

    function createNode(value, depth, parentId, key, path) {
      // Avoid duplicate paths
      if (processedPaths.has(path)) {
        return null;
      }
      processedPaths.add(path);

      // Hard limit on total nodes
      if (result.stats.totalNodes >= maxTotalNodes) {
        result.stats.truncated = true;
        return null;
      }

      // Check depth limit
      if (depth > maxDepth) {
        result.stats.truncated = true;
        return null;
      }

      // Check level limit and create clusters
      const levelCount = levelCounts.get(depth) || 0;
      if (levelCount >= maxNodesPerLevel) {
        if (enableClustering && levelCount % clusterSize === 0) {
          const clusterId = `cluster_${depth}_${Math.floor(levelCount / clusterSize)}`;
          const cluster = {
            id: clusterId,
            type: 'cluster',
            data: {
              depth,
              count: clusterSize,
              label: `+${clusterSize} nodes`,
              expandable: true,
            },
            position: { x: 0, y: 0 },
          };
          result.clusters.push(cluster);
          if (parentId) {
            result.edges.push({
              id: `${parentId}_${clusterId}`,
              source: parentId,
              target: clusterId,
              type: 'cluster',
            });
          }
        }
        result.stats.truncated = true;
        return null;
      }

      levelCounts.set(depth, levelCount + 1);
      result.stats.maxDepth = Math.max(result.stats.maxDepth, depth);

      const id = `node_${nodeId++}`;
      const nodeType = getNodeType(value);

      const node = {
        id,
        type: nodeType,
        data: {
          key: key || 'root',
          value: getNodeValue(value),
          path,
          depth,
          isLeaf: nodeType !== 'object' && nodeType !== 'array',
          childCount:
            nodeType === 'array'
              ? value.length
              : nodeType === 'object'
                ? Object.keys(value).length
                : 0,
        },
        position: { x: 0, y: 0 },
        measured: { width: 220, height: nodeType === 'array' ? 64 : 100 },
      };

      result.nodes.push(node);
      result.stats.totalNodes++;
      result.stats.processedNodes++;

      if (parentId) {
        result.edges.push({
          id: `${parentId}_${id}`,
          source: parentId,
          target: id,
          sourceHandle: key,
          type: 'smoothstep',
        });
        result.stats.totalEdges++;
      }

      // Queue children for processing
      if (nodeType === 'array') {
        const maxItems = Math.min(value.length, 20);
        for (let i = 0; i < maxItems; i++) {
          nodeQueue.push({
            value: value[i],
            depth: depth + 1,
            parentId: id,
            key: String(i),
            path: `${path}[${i}]`,
          });
        }
        if (value.length > maxItems) {
          node.data.truncated = true;
          node.data.truncatedCount = value.length - maxItems;
        }
      } else if (nodeType === 'object') {
        const keys = Object.keys(value);
        const maxKeys = Math.min(keys.length, 30);
        for (let i = 0; i < maxKeys; i++) {
          nodeQueue.push({
            value: value[keys[i]],
            depth: depth + 1,
            parentId: id,
            key: keys[i],
            path: `${path}.${keys[i]}`,
          });
        }
        if (keys.length > maxKeys) {
          node.data.truncated = true;
          node.data.truncatedCount = keys.length - maxKeys;
        }
      }

      return id;
    }

    // Start with root
    createNode(parsed, 0, null, 'root', 'root');

    // Process queue in batches
    let batchCount = 0;
    const processBatch = () => {
      const batchSize = Math.min(100, nodeQueue.length);
      const batch = nodeQueue.splice(0, batchSize);

      batch.forEach((item) => {
        createNode(item.value, item.depth, item.parentId, item.key, item.path);
      });

      // Send progress update
      if (batchCount % 5 === 0 || nodeQueue.length === 0) {
        self.postMessage({
          type: 'flow-progress',
          data: {
            processedNodes: result.stats.processedNodes,
            queueSize: nodeQueue.length,
            progress: Math.min(100, (result.stats.processedNodes / maxTotalNodes) * 100),
          },
        });
      }

      batchCount++;

      // Continue processing or finish
      if (nodeQueue.length > 0 && result.stats.totalNodes < maxTotalNodes) {
        setTimeout(processBatch, 0); // Yield to prevent blocking
      } else {
        // Send final result in chunks
        sendFlowChunks(result, chunkSize);
      }
    };

    // Start batch processing
    processBatch();
  } catch (error) {
    self.postMessage({
      type: 'flow-error',
      error: error.message,
    });
  }
}

function sendFlowChunks(result, chunkSize) {
  const nodeChunks = [];
  const edgeChunks = [];

  // Split nodes into chunks
  for (let i = 0; i < result.nodes.length; i += chunkSize) {
    nodeChunks.push(result.nodes.slice(i, i + chunkSize));
  }

  // Split edges into chunks
  for (let i = 0; i < result.edges.length; i += chunkSize) {
    edgeChunks.push(result.edges.slice(i, i + chunkSize));
  }

  // Send chunks progressively
  nodeChunks.forEach((chunk, index) => {
    setTimeout(() => {
      self.postMessage({
        type: 'flow-chunk',
        data: {
          nodes: chunk,
          chunkIndex: index,
          totalChunks: nodeChunks.length,
          isLastNodeChunk: index === nodeChunks.length - 1,
        },
      });
    }, index * 10);
  });

  // Send edges after nodes
  const edgeDelay = nodeChunks.length * 10;
  edgeChunks.forEach((chunk, index) => {
    setTimeout(
      () => {
        self.postMessage({
          type: 'flow-edges',
          data: {
            edges: chunk,
            chunkIndex: index,
            totalChunks: edgeChunks.length,
            isLastEdgeChunk: index === edgeChunks.length - 1,
          },
        });
      },
      edgeDelay + index * 10
    );
  });

  // Send complete message
  setTimeout(
    () => {
      self.postMessage({
        type: 'flow-complete',
        data: {
          stats: result.stats,
          clusters: result.clusters,
        },
      });
    },
    edgeDelay + edgeChunks.length * 10
  );
}

// Filter nodes based on viewport for virtualization
function filterViewportNodes(data, config) {
  const { nodes, viewport, zoom } = data;
  const padding = Math.max(200, 500 / zoom); // Adaptive padding

  const visibleNodes = [];
  const nodesToRender = new Set();

  // Use spatial indexing for better performance
  nodes.forEach((node) => {
    const pos = node.position;
    if (
      pos.x + node.measured.width >= viewport.x - padding &&
      pos.x <= viewport.x + viewport.width + padding &&
      pos.y + node.measured.height >= viewport.y - padding &&
      pos.y <= viewport.y + viewport.height + padding
    ) {
      visibleNodes.push(node);
      nodesToRender.add(node.id);
    }
  });

  // Apply LOD (Level of Detail) based on zoom
  const detailedNodes = [];
  const simplifiedNodes = [];

  visibleNodes.forEach((node) => {
    if (zoom > 0.5) {
      detailedNodes.push(node);
    } else {
      // Simplify node data for low zoom levels
      simplifiedNodes.push({
        id: node.id,
        type: node.type,
        position: node.position,
        data: {
          key: node.data.key,
          childCount: node.data.childCount,
        },
        measured: node.measured,
      });
    }
  });

  self.postMessage({
    type: 'viewport-nodes',
    data: {
      detailed: detailedNodes,
      simplified: simplifiedNodes,
      visibleCount: visibleNodes.length,
      zoom: zoom,
    },
  });
}

// Helper functions
function getNodeType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getNodeValue(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 97) + '...' : value;
  }
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  if (typeof value === 'object') {
    return `Object(${Object.keys(value).length})`;
  }
  return String(value);
}

function analyzeJson(obj, depth = 0, maxDepth = 0) {
  const stats = {
    totalKeys: 0,
    totalValues: 0,
    maxDepth: 0,
    types: {
      objects: 0,
      arrays: 0,
      strings: 0,
      numbers: 0,
      booleans: 0,
      nulls: 0,
    },
    arrayLengths: [],
    stringLengths: [],
    numberValues: [],
  };

  if (depth > maxDepth) {
    maxDepth = depth;
    stats.maxDepth = maxDepth;
  }

  if (Array.isArray(obj)) {
    stats.types.arrays++;
    stats.arrayLengths.push(obj.length);

    obj.forEach((item) => {
      const childStats = analyzeJson(item, depth + 1, maxDepth);
      mergeStats(stats, childStats);
    });
  } else if (obj !== null && typeof obj === 'object') {
    stats.types.objects++;
    const keys = Object.keys(obj);
    stats.totalKeys += keys.length;

    keys.forEach((key) => {
      const childStats = analyzeJson(obj[key], depth + 1, maxDepth);
      mergeStats(stats, childStats);
    });
  } else if (typeof obj === 'string') {
    stats.types.strings++;
    stats.stringLengths.push(obj.length);
    stats.totalValues++;
  } else if (typeof obj === 'number') {
    stats.types.numbers++;
    stats.numberValues.push(obj);
    stats.totalValues++;
  } else if (typeof obj === 'boolean') {
    stats.types.booleans++;
    stats.totalValues++;
  } else if (obj === null) {
    stats.types.nulls++;
    stats.totalValues++;
  }

  return stats;
}

function mergeStats(target, source) {
  target.totalKeys += source.totalKeys;
  target.totalValues += source.totalValues;
  target.maxDepth = Math.max(target.maxDepth, source.maxDepth);

  Object.keys(source.types).forEach((key) => {
    target.types[key] += source.types[key];
  });

  target.arrayLengths.push(...source.arrayLengths);
  target.stringLengths.push(...source.stringLengths);
  target.numberValues.push(...source.numberValues);
}
