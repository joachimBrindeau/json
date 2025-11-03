'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface FAQ {
  question: string;
  answer: string;
  keywords?: string[];
}

const faqs: FAQ[] = [
  {
    question: 'What is JSON and why do I need a JSON viewer?',
    answer:
      "JSON (JavaScript Object Notation) is a lightweight data interchange format that's easy for humans to read and write. A JSON viewer helps you format, validate, and visualize JSON data with syntax highlighting, making it easier to debug APIs, configure applications, and understand data structures.",
    keywords: ['json', 'data format', 'api', 'debugging'],
  },
  {
    question: 'Is your JSON viewer free to use?',
    answer:
      'Yes! Our JSON viewer is completely free to use with no registration required. You can format, validate, and share JSON documents without any limitations. We also offer advanced features like private libraries and team collaboration.',
    keywords: ['free', 'no registration', 'json formatter'],
  },
  {
    question: 'Can I share my JSON documents with others?',
    answer:
      'Absolutely! You can instantly share any JSON document with a unique URL. Choose between public sharing (visible in our community library) or private sharing (only accessible with the direct link).',
    keywords: ['share json', 'collaboration', 'json sharing'],
  },
  {
    question: "What's the difference between Tree, List, and Flow views?",
    answer:
      'Tree view shows JSON in a hierarchical, expandable structure perfect for navigation. List view displays all key-value pairs in a flat, searchable format. Flow view creates a visual diagram showing relationships between JSON objects and arrays.',
    keywords: ['json visualization', 'tree view', 'json explorer'],
  },
  {
    question: 'Does the JSON viewer work offline?',
    answer:
      'Yes! Our JSON viewer works offline after your first visit. All processing happens in your browser - your JSON data never leaves your device unless you explicitly choose to share it.',
    keywords: ['offline', 'privacy', 'browser-based'],
  },
  {
    question: 'Can I validate JSON and see formatting errors?',
    answer:
      'Yes! Our JSON validator provides real-time error detection with precise line and column information. It highlights syntax errors, missing brackets, invalid characters, and provides suggestions for quick fixes.',
    keywords: ['json validation', 'error detection', 'syntax errors'],
  },
  {
    question: 'What file formats can I export my JSON to?',
    answer:
      'You can export JSON to multiple formats including prettified JSON, minified JSON, CSV, XML, YAML, and even copy formatted JSON for documentation. Perfect for different use cases and integrations.',
    keywords: ['export json', 'json formats', 'convert json'],
  },
  {
    question: 'How large JSON files can I process?',
    answer:
      'Our tool can handle very large JSON files (100MB+) efficiently using virtual scrolling and progressive loading. For best performance on huge files, we recommend using our streaming processor for files over 50MB.',
    keywords: ['large json files', 'performance', 'big data'],
  },
];

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Generate FAQ structured data
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <section className="py-16 bg-muted/30" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData),
        }}
      />

      <div className="container mx-auto px-6">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about our JSON viewer and formatter
          </p>
        </header>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index} className="overflow-hidden">
              <Collapsible open={openItems.has(index)} onOpenChange={() => toggleItem(index)}>
                <CollapsibleTrigger className="w-full p-6 text-left hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg pr-4">{faq.question}</h3>
                    {openItems.has(index) ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-6">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
