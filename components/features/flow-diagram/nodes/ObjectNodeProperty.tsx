import { memo } from 'react';
import { validateJsonDataType } from '@/components/features/flow-diagram/utils/utils';
import { BooleanChip } from '@/components/features/flow-diagram/nodes/BooleanChip';
import { NullChip } from '@/components/features/flow-diagram/nodes/NullChip';
import { DefaultHandle } from '@/components/features/flow-diagram/DefaultHandle';
import { HoveringBlueDot } from '@/components/features/flow-diagram/HoveringBlueDot';
import { isEmptyArray } from '@/components/features/flow-diagram/utils/utils';

// Simplified empty object check
const isEmptyObject = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};

type Props = {
  nodeId: string;
  propertyK: string;
  propertyV: any;
  hasChildNode: boolean;
};

const _ObjectNodeProperty = ({ nodeId, propertyK, propertyV, hasChildNode }: Props) => {
  const { isObjectData, isArrayData, isStringData, isNumberData, isBooleanData, isNullData } =
    validateJsonDataType(propertyV);

  // Simplified hover state - in a real implementation you'd connect to a store
  const isHoveredFromNodeDetail = false;

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
        {isBooleanData && <BooleanChip value={propertyV as boolean} size="sm" />}
        {isNullData && <NullChip size="sm" />}
      </div>

      {hasChildNode && (
        <DefaultHandle style={{ backgroundColor: '#94a3b8' }} id={propertyK} type="source" />
      )}

      {isHoveredFromNodeDetail && <HoveringBlueDot />}
    </div>
  );
};

export const ObjectNodeProperty = memo(_ObjectNodeProperty);
