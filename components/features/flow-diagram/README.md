# JSON Sea Components

This directory contains adapted components from the [json-sea](https://github.com/leeyeh/json-sea) project, modified to work with shadcn/ui components instead of NextUI.

## Overview

JSON Sea provides a visual representation of JSON data as interactive node diagrams using ReactFlow. It parses JSON structures and creates nodes for objects, arrays, and primitives with proper connections.

## Core Components

### Node Components
- **ObjectNode**: Renders JSON objects as expandable nodes showing properties
- **ArrayNode**: Renders JSON arrays as circular nodes with index labels
- **PrimitiveNode**: Renders primitive values (strings, numbers, booleans, null)

### UI Components
- **BooleanChip**: Badge component for boolean values
- **NullChip**: Badge component for null values
- **NodeShell**: Base wrapper for all node types
- **ObjectNodeProperty**: Individual property renderer for object nodes

### Core Functions
- **jsonParser**: Parses JSON data into ReactFlow nodes and edges
- **getLayoutedSeaNodes**: Uses Dagre layout algorithm for node positioning
- **getXYPosition**: Calculates initial node positions

## Usage

### Basic Usage

```typescript
import { JsonSeaDiagram } from '@/components/json-sea';

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
    <JsonSeaDiagram 
      data={jsonData} 
      className="w-full h-[800px]" 
    />
  );
}
```

### Advanced Usage

```typescript
import { 
  jsonParser, 
  getLayoutedSeaNodes,
  ObjectNode,
  ArrayNode,
  PrimitiveNode,
  NodeType 
} from '@/components/json-sea';

const nodeTypes = {
  [NodeType.Object]: ObjectNode,
  [NodeType.Array]: ArrayNode,
  [NodeType.Primitive]: PrimitiveNode,
};

function CustomJsonViewer({ data }: { data: any }) {
  const { seaNodes, edges } = jsonParser(data);
  const layoutedNodes = getLayoutedSeaNodes(seaNodes, edges);

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

## Key Features

- **Interactive Nodes**: Click and drag nodes around the diagram
- **Automatic Layout**: Uses Dagre algorithm for optimal node positioning
- **Type-Safe**: Full TypeScript support with proper types
- **Responsive Design**: Works on different screen sizes
- **shadcn/ui Integration**: Uses consistent design system

## Node Types

### Object Node
- Displays object properties as a vertical list
- Shows property names on the left, values/icons on the right
- Handles nested objects and arrays with connection points

### Array Node
- Circular nodes showing array index or "root" for root arrays
- Connects to child elements with visual links
- Chain edges connect array items visually

### Primitive Node
- Displays primitive values with appropriate styling
- Strings: quoted and truncated if long
- Numbers: styled in green
- Booleans: colored badges (green/red)
- Null: gray badge

## Styling

The components use Tailwind CSS classes and are designed to work with shadcn/ui themes. Key styling features:

- Object nodes: rounded rectangles with borders
- Array nodes: circular with blue styling
- Primitive nodes: rounded rectangles with purple styling
- Hover effects and interactive states
- Consistent color scheme

## Dependencies

- **dagre**: Layout algorithm for node positioning
- **reactflow**: Flow diagram framework
- **nanoid**: Unique ID generation
- **@radix-ui**: UI primitives (via shadcn/ui)

## Differences from Original

The main adaptations from the original json-sea project:

1. **UI Framework**: Replaced NextUI with shadcn/ui components
2. **Simplified State**: Removed complex store dependencies for demo purposes
3. **Styling**: Adapted to use Tailwind CSS classes
4. **Component Structure**: Streamlined component hierarchy
5. **Theme Integration**: Works with shadcn/ui theme system

## Notes

- This is a simplified adaptation focusing on core functionality
- Some advanced features like node details panels are not included
- Store-based state management is simplified for easier integration
- The layout algorithm and JSON parsing logic remain largely unchanged