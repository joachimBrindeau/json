'use client';

import React from 'react';
import { JsonTransformPage } from '@/components/pages/JsonTransformPage';
import { Minimize2 } from 'lucide-react';

export default function MinifyPage() {
  return (
    <JsonTransformPage
      actionVerb="Minify"
      outputTitle="Minified Output"
      buttonIcon={<Minimize2 className="h-3 w-3 mr-1" />}
      transform={(obj) => JSON.stringify(obj)}
    />
  );
}
