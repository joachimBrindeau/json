import { Node } from 'reactflow';

export interface NodeDetails {
  id: string;
  key: string;
  value: unknown;
  type: string;
  level: number;
  path: string;
  size: number;
  childCount: number;
}

export const extractNodeDetails = (node: Node): NodeDetails => {
  let value: unknown;
  let childCount = 0;
  let key = node.id;

  if (node.type === 'object') {
    value = node.data.obj || {};
    childCount = Object.keys(value as object).length;
    key = node.data.isRootNode ? 'JSON Root' : node.id;
  } else if (node.type === 'array') {
    value = node.data.items || [];
    childCount = (value as unknown[]).length;
    key = node.data.isRootNode ? 'JSON Root' : `[${node.data.arrayIndex}]`;
  } else {
    value = node.data.value;
    key = node.data.propertyK || node.id;
  }

  const type = node.type === 'primitive'
    ? value === null
      ? 'null'
      : Array.isArray(value)
        ? 'array'
        : typeof value
    : node.type || 'unknown';

  return {
    id: node.id,
    key,
    value,
    type,
    level: node.data.level || 0,
    path: node.data.parentNodePathIds?.join('.') || 'root',
    size: JSON.stringify(value).length,
    childCount,
  };
};
