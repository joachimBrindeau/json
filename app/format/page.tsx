'use client';

import React from 'react';
import { JsonTransformPage } from '@/components/pages/JsonTransformPage';
import { Zap } from 'lucide-react';

export default function FormatPage() {
  return (
    <JsonTransformPage
      actionVerb="Format"
      outputTitle="Formatted Output"
      buttonIcon={<Zap className="h-3 w-3 mr-1" />}
      transform={(obj) => JSON.stringify(obj, null, 2)}
      copySuccessDescription="Formatted JSON copied to clipboard"
    />
  );
}
