import {
  JsonDataType,
  SeaNode,
  ArraySeaNode,
  ObjectSeaNode,
  PrimitiveSeaNode,
  NodeType,
} from '@/components/features/flow-diagram/utils/types';

/**
 * Returns true if argument is an 'array' and false otherwise.
 * @param {unknown} v - the value to check
 */
export const isArray = <T extends any[]>(v: unknown): v is T => {
  return Array.isArray(v);
};

/**
 * Returns true if argument is an 'object' and false otherwise.
 * Since the result of 'typeof []' is 'object', checks value with isArray() function.
 * And the result of 'typeof null' is 'object' too, validate v is not null.
 * @param {unknown} v - the value to check
 */
export const isObject = (v: unknown): v is object => {
  return v !== null && !isArray(v) && typeof v === 'object';
};

/**
 * Returns true if argument is a 'string' and false otherwise.
 * @param {unknown} v - the value to check
 */
export const isString = (v: unknown): v is string => {
  return typeof v === 'string';
};

/**
 * Returns true if argument is a 'number' and false otherwise.
 * @param {unknown} v - the value to check
 */
export const isNumber = (v: unknown): v is number => {
  return typeof v === 'number';
};

/**
 * Returns true if argument is a 'boolean' and false otherwise.
 * @param {unknown} v - the value to check
 */
export const isBoolean = (v: unknown): v is boolean => {
  return typeof v === 'boolean';
};

/**
 * Returns true if argument is a 'null' and false otherwise.
 * @param {unknown} v - the value to check
 */
export const isNull = (v: unknown): v is null => {
  return v === null;
};

/**
 * Returns true if argument is a valid json code(string) and false otherwise.
 * @param {string} code - the value to check
 */
export const isValidJson = (code: string): boolean => {
  try {
    const parsedCode = JSON.parse(code);
    return isObject(parsedCode) || isArray(parsedCode);
  } catch (error) {
    return false;
  }
};

export const formatJsonLikeData = (data: object | any[] | string): string => {
  const stringifyTarget = isString(data) ? JSON.parse(data) : data;
  const replacer: (number | string)[] | null = null;
  const space: string | number = 2;

  return JSON.stringify(stringifyTarget, replacer, space);
};

export const isLastItemOfArray = <T extends any[]>(index: number, array: T): boolean =>
  index === array.length - 1;

export const isEmptyArray = <T extends any[]>(array: T): boolean => array.length < 1;

export const validateJsonDataType = (
  v: unknown
): {
  [P in keyof typeof JsonDataType as `is${P}Data`]: boolean;
} & {
  isPrimitiveData: boolean;
} => {
  const isStringData: boolean = isString(v);
  const isNumberData: boolean = isNumber(v);
  const isBooleanData: boolean = isBoolean(v);
  const isNullData: boolean = isNull(v);

  return {
    isObjectData: isObject(v),
    isArrayData: isArray(v),
    isStringData,
    isNumberData,
    isBooleanData,
    isNullData,
    isPrimitiveData: isStringData || isNumberData || isBooleanData || isNullData,
  };
};

export const getJsonDataType = (v: unknown): JsonDataType => {
  const { isObjectData, isArrayData, isStringData, isNumberData, isBooleanData, isNullData } =
    validateJsonDataType(v);

  return isObjectData
    ? JsonDataType.Object
    : isArrayData
      ? JsonDataType.Array
      : isStringData
        ? JsonDataType.String
        : isNumberData
          ? JsonDataType.Number
          : isBooleanData
            ? JsonDataType.Boolean
            : isNullData
              ? JsonDataType.Null
              : JsonDataType.Null;
};

export const encloseSquareBrackets = (v: string | number): string => `[${v}]`;

// SeaNode type guards
export const isArraySeaNode = (node: SeaNode): node is ArraySeaNode => {
  return node.type === NodeType.Array;
};

export const isObjectSeaNode = (node: SeaNode): node is ObjectSeaNode => {
  return node.type === NodeType.Object;
};

export const isPrimitiveSeaNode = (node: SeaNode): node is PrimitiveSeaNode => {
  return node.type === NodeType.Primitive;
};
