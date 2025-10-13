import { memo } from 'react';
import { validateJsonDataType, isEmptyArray } from '@/components/features/viewer/flow/utils/flow-utils';
import { FlowBooleanChip } from '@/components/features/viewer/flow/nodes/FlowBooleanChip';
import { FlowNullChip } from '@/components/features/viewer/flow/nodes/FlowNullChip';
import { FlowDefaultHandle } from '@/components/features/viewer/flow/FlowDefaultHandle';

const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

type Props = {
  nodeId: string;
  propertyK: string;
  propertyV: any;
  hasChildNode: boolean;
};

const ObjectNodePropertyComponent = ({ nodeId, propertyK, propertyV, hasChildNode }: Props) => {
  const { isObjectData, isArrayData, isStringData, isNumberData, isBooleanData, isNullData } =
    validateJsonDataType(propertyV);

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

      {hasChildNode && (
        <FlowDefaultHandle style={{ backgroundColor: '#94a3b8' }} id={propertyK} type="source" />
      )}
    </div>
  );
};

export const FlowObjectNodeProperty = memo(ObjectNodePropertyComponent);
