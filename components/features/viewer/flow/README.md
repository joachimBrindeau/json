# Flow Diagram Components

**Location:** `components/features/viewer/flow/`  
**Purpose:** Visual representation of JSON data as interactive node diagrams using ReactFlow

---

## Overview

The Flow Diagram components provide an interactive, visual way to explore JSON data structures. Built on ReactFlow, they parse JSON and create nodes for objects, arrays, and primitives with proper connections.

**Adapted from:** [json-sea](https://github.com/leeyeh/json-sea) project  
**UI Framework:** shadcn/ui components (replacing NextUI from original)

---

## Structure

```
flow/
├── FlowView.tsx              # Main flow diagram component
├── FlowDiagram.tsx           # Simplified diagram component
├── FlowChainHandle.tsx       # Chain connection handle
├── FlowDefaultHandle.tsx     # Default connection handle
├── FlowHoveringDot.tsx       # Hovering indicator
├── index.ts                  # Barrel export
│
├── nodes/                    # Node components
│   ├── FlowArrayNode.tsx     # Array node renderer
│   ├── FlowObjectNode.tsx    # Object node renderer
│   ├── FlowPrimitiveNode.tsx # Primitive value renderer
│   ├── FlowBooleanChip.tsx   # Boolean badge
│   ├── FlowNullChip.tsx      # Null badge
│   ├── FlowNodeShell.tsx     # Base node wrapper
│   └── FlowObjectNodeProperty.tsx  # Object property renderer
│
├── edges/                    # Edge components
│   ├── FlowDefaultEdge.tsx   # Default edge
│   └── FlowChainEdge.tsx     # Chain edge for arrays
│
└── utils/                    # Utilities
    ├── flow-parser.ts        # JSON to nodes/edges parser
    ├── flow-layout.ts        # Dagre layout algorithm
    ├── flow-types.ts         # TypeScript types
    ├── flow-constants.ts     # Constants and sizes
    └── flow-utils.ts         # Helper functions
```

---

## Components

### Main Components

#### FlowView
The primary flow diagram component with full features.

```typescript
import { FlowView } from '@/components/features/viewer/flow';

<FlowView 
  json={data} 
  className="w-full h-[800px]"
  onNodeClick={(node) => console.log(node)}
/>
```

**Props:**
- `json` - JSON data to visualize
- `className` - Optional CSS classes
- `onNodeClick` - Optional click handler

**Features:**
- Interactive nodes (drag, zoom, pan)
- Node details modal
- MiniMap and controls
- Automatic layout

---

#### FlowDiagram
Simplified diagram component without interactivity.

```typescript
import { FlowDiagram } from '@/components/features/viewer/flow';

<FlowDiagram 
  data={jsonData} 
  className="w-full h-[600px]" 
/>
```

**Props:**
- `data` - JSON object or array
- `className` - Optional CSS classes

---

### Node Components

#### FlowObjectNode
Renders JSON objects as expandable nodes.

**Features:**
- Displays properties as vertical list
- Property names on left, values/icons on right
- Connection points for nested objects/arrays

---

#### FlowArrayNode
Renders JSON arrays as circular nodes.

**Features:**
- Circular design with index label
- "root" label for root arrays
- Chain edges connect array items

---

#### FlowPrimitiveNode
Renders primitive values (strings, numbers, booleans, null).

**Features:**
- Strings: quoted and truncated if long
- Numbers: green styling
- Booleans: colored badges (green/red)
- Null: gray badge

---

### Edge Components

#### FlowDefaultEdge
Standard edge connecting nodes.

#### FlowChainEdge
Special edge for connecting array items in sequence.

---

## Usage Examples

### Basic Usage

```typescript
import { FlowView } from '@/components/features/viewer/flow';

const jsonData = {
  name: "John Doe",
  age: 30,
  addresses: [
    { type: "home", city: "New York" },
    { type: "work", city: "Boston" }
  ],
  isActive: true,
  profile: null
};

function MyComponent() {
  return (
    <FlowView 
      json={jsonData} 
      className="w-full h-[800px]" 
    />
  );
}
```

---

### Advanced Usage with Custom Node Types

```typescript
import { 
  jsonParser, 
  getLayoutedSeaNodes,
  FlowObjectNode,
  FlowArrayNode,
  FlowPrimitiveNode,
  NodeType 
} from '@/components/features/viewer/flow';

const nodeTypes = {
  [NodeType.Object]: FlowObjectNode,
  [NodeType.Array]: FlowArrayNode,
  [NodeType.Primitive]: FlowPrimitiveNode,
};

function CustomFlowViewer({ data }: { data: any }) {
  const { flowNodes, edges } = jsonParser(data);
  const layoutedNodes = getLayoutedSeaNodes(flowNodes, edges);

  return (
    <ReactFlow
      nodes={layoutedNodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
}
```

---

### With Node Click Handler

```typescript
import { FlowView } from '@/components/features/viewer/flow';
import { Node } from 'reactflow';

function InteractiveFlow() {
  const handleNodeClick = (node: Node) => {
    console.log('Clicked node:', node.id);
    console.log('Node data:', node.data);
  };

  return (
    <FlowView 
      json={myData} 
      onNodeClick={handleNodeClick}
    />
  );
}
```

---

## Key Features

### Interactive Nodes
- **Drag & Drop:** Move nodes around the diagram
- **Zoom & Pan:** Navigate large diagrams
- **Click:** View node details in modal

### Automatic Layout
- Uses **Dagre** algorithm for optimal positioning
- Hierarchical layout based on JSON structure
- Configurable spacing and sizing

### Type-Safe
- Full TypeScript support
- Proper types for all components
- Type guards for node types

### Responsive Design
- Works on different screen sizes
- Configurable dimensions
- Mobile-friendly controls

### shadcn/ui Integration
- Consistent design system
- Theme-aware styling
- Accessible components

---

## Node Types

### Object Node
- **Shape:** Rounded rectangle
- **Color:** Border with background
- **Content:** Property list (key: value)
- **Connections:** Handles for nested objects/arrays

### Array Node
- **Shape:** Circle
- **Color:** Blue styling
- **Content:** Index number or "root"
- **Connections:** Chain edges to items

### Primitive Node
- **Shape:** Rounded rectangle
- **Color:** Purple styling
- **Content:** Value with type-specific formatting
- **Types:**
  - String: `"value"` (quoted)
  - Number: `42` (green)
  - Boolean: Badge (green/red)
  - Null: Badge (gray)

---

## Styling

Components use Tailwind CSS and shadcn/ui theming:

- **Object nodes:** `rounded-lg border bg-card`
- **Array nodes:** `rounded-full bg-blue-500`
- **Primitive nodes:** `rounded-md bg-purple-500/10`
- **Hover effects:** Interactive states
- **Theme-aware:** Respects light/dark mode

---

## Dependencies

- **reactflow** - Flow diagram framework
- **dagre** - Layout algorithm
- **nanoid** - Unique ID generation
- **@radix-ui** - UI primitives (via shadcn/ui)

---

## Differences from Original json-sea

1. **UI Framework:** shadcn/ui instead of NextUI
2. **Simplified State:** Removed complex store dependencies
3. **Styling:** Tailwind CSS classes
4. **Component Structure:** Hierarchical naming (Flow prefix)
5. **Theme Integration:** Works with shadcn/ui themes
6. **Location:** Integrated into viewer/ directory

---

## Backwards Compatibility

Old imports still work via aliases:

```typescript
// Old (still works)
import { JsonFlowView } from '@/components/features/viewer/flow';
import { ObjectNode, ArrayNode } from '@/components/features/viewer/flow';

// New (recommended)
import { FlowView } from '@/components/features/viewer/flow';
import { FlowObjectNode, FlowArrayNode } from '@/components/features/viewer/flow';
```

---

## Performance Considerations

### Large JSON Files
- Flow diagrams can be resource-intensive for large JSON
- Consider limiting depth or size
- Use lazy loading for heavy components

### Optimization Tips
- Memoize node components
- Use React.memo for expensive renders
- Limit initial visible nodes
- Implement virtual scrolling for very large diagrams

---

## Troubleshooting

### Nodes Not Appearing
- Check JSON is valid
- Verify data prop is passed correctly
- Check console for parsing errors

### Layout Issues
- Ensure container has explicit height
- Check Dagre layout configuration
- Verify node sizes in constants

### Performance Issues
- Reduce JSON size/depth
- Disable MiniMap for large diagrams
- Use production build

---

## Future Improvements

- [ ] Virtual scrolling for large diagrams
- [ ] Collapsible nodes
- [ ] Search/filter nodes
- [ ] Export diagram as image
- [ ] Custom node styling
- [ ] Undo/redo support

---

## Related Documentation

- [Viewer Architecture](../README.md)
- [ReactFlow Documentation](https://reactflow.dev/)
- [Original json-sea](https://github.com/leeyeh/json-sea)


