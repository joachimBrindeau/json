import { memo } from 'react';
import { validateJsonDataType, isEmptyArray } from '@/components/features/viewer/flow/utils/flow-utils';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowHandle } from '@/components/features/viewer/flow/FlowHandle';
import { FlowCollapseButton } from '@/components/features/viewer/flow/FlowCollapseButton';
import type { JsonValue } from '@/lib/types/json';

const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

type Props = {
  nodeId: string;
  propertyK: string;
  propertyV: JsonValue;
  hasChildNode: boolean;
  childNodeId?: string;
  collapsedBranches?: Set<string>;
  onToggleCollapse?: (parentId: string, childId: string) => void;
};

const ObjectNodePropertyComponent = ({
  nodeId,
  propertyK,
  propertyV,
  hasChildNode,
  childNodeId,
  collapsedBranches,
  onToggleCollapse
}: Props) => {
  const { isObjectData, isArrayData, isStringData, isNumberData, isBooleanData, isNullData } =
    validateJsonDataType(propertyV);

  // Render handle for properties that have or could have child nodes (objects/arrays)
  const shouldRenderHandle = isObjectData || isArrayData;

  // Check if this branch is collapsed
  const branchId = childNodeId ? `${nodeId}:${childNodeId}` : '';
  const isCollapsed = childNodeId && collapsedBranches ? collapsedBranches.has(branchId) : false;

  return (
    <div className="relative flex h-10 items-center justify-between border-b border-gray-100 px-2 py-1 last:border-b-0">
      <span className="mr-4 font-medium text-blue-600 text-sm">{propertyK}</span>

      <div className="flex items-center space-x-2">
        {isObjectData && (
          <span className="text-gray-500 text-xs">
            {isEmptyObject(propertyV as object) ? '{}' : '{...}'}
          </span>
        )}
        {isArrayData && (
          <span className="text-gray-500 text-xs">
            {isEmptyArray(propertyV as any[]) ? '[]' : '[...]'}
          </span>
        )}

        {isStringData && (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm max-w-[120px]">
            {JSON.stringify(propertyV)}
          </span>
        )}
        {isNumberData && (
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-green-600 font-mono text-sm">
            {propertyV}
          </span>
        )}
        {isBooleanData && <FlowBooleanChip value={propertyV as boolean} size="sm" />}
        {isNullData && <FlowNullChip size="sm" />}
      </div>

      {shouldRenderHandle && (
        <FlowHandle style={{ backgroundColor: '#94a3b8' }} id={propertyK} type="source" direction="horizontal" />
      )}

      {/* Collapse button for properties with child nodes */}
      {hasChildNode && childNodeId && onToggleCollapse && (
        <FlowCollapseButton
          nodeId={nodeId}
          isCollapsed={isCollapsed}
          onToggle={() => onToggleCollapse(nodeId, childNodeId)}
          position="right"
        />
      )}
    </div>
  );
};

export const FlowObjectNodeProperty = memo(ObjectNodePropertyComponent);
