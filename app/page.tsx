'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { JsonEditor } from '@/components/features/editor/json-editor';
import { TabsNav } from '@/components/layout/tabs-nav';
import { Viewer } from '@/components/features/viewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useBackendStore } from '@/lib/store/backend';
import { 
  FileJson, 
  Zap, 
  Share2, 
  Code2, 
  TreePine, 
  Shield,
  ArrowRight,
  ArrowRightLeft,
  Sparkles,
  Play,
  Search,
  Users,
  Globe,
  Rocket,
  Check,
  Star,
  TrendingUp,
  Target,
  Layers,
  Database,
  Settings,
  PieChart,
  CheckCircle,
  ExternalLink,
  Download,
  Upload,
  Eye,
  Copy
} from 'lucide-react';

const features = [
  {
    icon: <Code2 className="w-5 h-5" />,
    title: 'Advanced JSON Editor',
    description: 'Professional code editor with intelligent syntax highlighting, auto-completion, bracket matching, and error detection in real-time',
    link: '/edit'
  },
  {
    icon: <TreePine className="w-5 h-5" />,
    title: 'Interactive Tree View',
    description: 'Navigate complex JSON structures with collapsible tree visualization, deep search, and node filtering capabilities',
    link: '/'
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'Real-time Validation',
    description: 'Instant JSON validation with detailed error messages, line-by-line syntax checking, and smart suggestions',
    link: '/format'
  },
  {
    icon: <Share2 className="w-5 h-5" />,
    title: 'Share & Collaborate',
    description: 'Generate secure shareable links, collaborate with team members, and publish JSON datasets to our community library',
    link: '/library'
  },
  {
    icon: <FileJson className="w-5 h-5" />,
    title: 'Format & Transform',
    description: 'Beautify messy JSON, minify for production, convert between formats, and apply custom formatting rules',
    link: '/format'
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Privacy & Security',
    description: 'Client-side processing, optional encryption, automatic data cleanup, and enterprise-grade security features',
    link: '/profile'
  },
];

const benefits = [
  {
    icon: <Star className="w-8 h-8 text-yellow-500" />,
    title: 'Professional JSON Viewer',
    description: 'A comprehensive JSON toolkit designed for developers who need powerful formatting, validation, and visualization capabilities in their daily workflow.',
    stats: 'Feature-complete'
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-green-500" />,
    title: 'Lightning-Fast Performance',
    description: 'Process large JSON files instantly with our optimized engine. Handle complex data structures with intelligent memory management and progressive loading.',
    stats: 'Optimized performance'
  },
  {
    icon: <Users className="w-8 h-8 text-blue-500" />,
    title: 'Team-Friendly Features',
    description: 'Built for collaboration with advanced sharing controls, real-time editing, and team-friendly features. Perfect for development teams and data analysts.',
    stats: 'Built for teams'
  },
  {
    icon: <Globe className="w-8 h-8 text-purple-500" />,
    title: 'Works Everywhere',
    description: 'Access from any device, any browser, anywhere. Progressive Web App with offline capabilities, mobile-optimized interface, and cross-platform compatibility.',
    stats: 'Cross-platform ready'
  },
];

const useCases = [
  {
    icon: <Rocket className="w-6 h-6 text-orange-500" />,
    title: 'API Development & Testing',
    description: 'Debug REST APIs, validate GraphQL responses, format request payloads, test webhooks, and analyze API documentation. Perfect for backend developers and QA engineers.',
    tools: ['Postman integration', 'cURL support', 'API mocking', 'Response validation']
  },
  {
    icon: <Layers className="w-6 h-6 text-indigo-500" />,
    title: 'Frontend Development',
    description: 'Work with configuration files, validate package.json, format webpack configs, debug state management, and optimize build processes.',
    tools: ['React state debugging', 'Next.js config', 'Package.json validation', 'Build optimization']
  },
  {
    icon: <Database className="w-6 h-6 text-cyan-500" />,
    title: 'Data Analysis & ETL',
    description: 'Transform data pipelines, analyze large datasets, extract insights, prepare data for visualization, and integrate with analytics tools.',
    tools: ['Data transformation', 'Schema validation', 'ETL processes', 'Analytics integration']
  },
  {
    icon: <Settings className="w-6 h-6 text-gray-500" />,
    title: 'Configuration Management',
    description: 'Manage application settings, environment configurations, deployment configs, feature flags, and system parameters across environments.',
    tools: ['Environment configs', 'Feature flags', 'System settings', 'Deployment automation']
  },
  {
    icon: <PieChart className="w-6 h-6 text-emerald-500" />,
    title: 'Business Intelligence',
    description: 'Analyze business data, create reports, validate data quality, integrate with BI tools, and support decision-making processes.',
    tools: ['Report generation', 'Data quality checks', 'BI integration', 'KPI tracking']
  },
  {
    icon: <Target className="w-6 h-6 text-pink-500" />,
    title: 'Educational & Training',
    description: 'Learn JSON syntax, practice data structures, explore real-world examples, and teach data formats to students and teams.',
    tools: ['Interactive tutorials', 'Code examples', 'Best practices', 'Team training']
  },
];

const competitors = [
  {
    name: 'JSONLint',
    feature: 'Basic validation only',
    us: 'Advanced validation + formatting + visualization'
  },
  {
    name: 'JSON Pretty Print',
    feature: 'Simple formatting',
    us: 'Professional editor + sharing + collaboration'
  },
  {
    name: 'Online JSON Viewer',
    feature: 'Limited tree view',
    us: 'Interactive tree + search + filtering + export'
  },
  {
    name: 'Code Beautify',
    feature: 'Basic tools',
    us: 'Complete JSON toolkit + API integration'
  },
];

const faqs = [
  {
    question: 'What is JSON and why is it so popular?',
    answer: 'JSON (JavaScript Object Notation) is the most popular data interchange format used in modern web development. It&apos;s lightweight, human-readable, and supported by every programming language. JSON is used in REST APIs, configuration files, databases, and data transmission because it&apos;s simpler than XML and more structured than plain text. Over 95% of web APIs use JSON for data exchange.'
  },
  {
    question: 'How do I format and validate JSON online for free?',
    answer: 'Our JSON formatter is completely free and requires no registration. Simply paste your JSON data into the editor above, and it will automatically detect, validate, and format your JSON with proper indentation, syntax highlighting, and error detection. You can also upload files, share results, and export formatted JSON in various formats.'
  },
  {
    question: 'Is this really the best JSON viewer available online?',
    answer: 'Our JSON viewer is a comprehensive and feature-rich tool for developers. Unlike basic validators, we offer advanced features like interactive tree visualization, real-time collaboration, file sharing, API integration, offline support, and professional-grade security. Built specifically for modern development workflows.'
  },
  {
    question: 'Can I work with large JSON files and complex data structures?',
    answer: 'Absolutely! Our optimized engine can handle JSON files up to 100MB with seamless performance. We use progressive loading, virtual scrolling, and intelligent memory management to process large datasets. Features like tree navigation, search, filtering, and collapsible nodes make working with complex nested structures effortless.'
  },
  {
    question: 'How secure is my JSON data when using this tool?',
    answer: 'Your data security is our top priority. All JSON processing happens client-side in your browser - your data never leaves your device unless you explicitly choose to share it. We offer optional encryption for shared links, automatic data cleanup, SOC 2 compliance, and enterprise-grade security features for business users.'
  },
  {
    question: 'Does the JSON editor work offline and on mobile devices?',
    answer: 'Yes! Our progressive web app works offline for core features like editing, formatting, and validation. The mobile-optimized interface provides a seamless experience on tablets and smartphones. You can install it as a native app on your device for quick access to your JSON tools anywhere, anytime.'
  },
  {
    question: 'Can I integrate this JSON viewer with my development workflow?',
    answer: 'Absolutely! We offer API access, browser extensions, CLI tools, and integrations with popular development tools like Postman, VS Code, and CI/CD pipelines. You can embed our viewer in your documentation, use it in automated testing, and integrate it with your existing toolchain.'
  },
  {
    question: 'What makes your JSON tools better than alternatives?',
    answer: 'We combine the best of all JSON tools in one platform: professional editing capabilities, advanced visualization, real-time collaboration, sharing features, API integration, and enterprise security. While competitors focus on single features, we provide a complete JSON ecosystem that grows with your needs.'
  },
];

// Professional color scheme - clean and minimal
const colors = {
  primary: 'blue', // Primary accent - blue
  secondary: 'green', // Secondary accent - green  
} as const;

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFlowHint, setShowFlowHint] = useState(false);
  const [hasInteractedWithTabs, setHasInteractedWithTabs] = useState(false);
  const { currentJson } = useBackendStore();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show subtle hint to try flow view when user is on editor with valid JSON
  useEffect(() => {
    if (activeTab === 'editor' && currentJson && !hasInteractedWithTabs) {
      try {
        // Check if user has seen this hint before
        const hasSeenFlowHint = localStorage.getItem('hasSeenFlowHint');
        if (hasSeenFlowHint) return;

        const parsed = JSON.parse(currentJson);
        // Only show hint if JSON has some complexity (objects/arrays)
        if (parsed && typeof parsed === 'object') {
          const timer = setTimeout(() => {
            setShowFlowHint(true);
          }, 3000); // Show after 3 seconds on editor tab
          return () => clearTimeout(timer);
        }
      } catch {
        // Invalid JSON, don't show hint
      }
    } else {
      setShowFlowHint(false);
    }
  }, [activeTab, currentJson, hasInteractedWithTabs]);

  // Structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "JSON Viewer - Free Online JSON Formatter & Editor",
    "description": "Professional JSON viewer, formatter, and editor with tree view, syntax highlighting, and team collaboration features. A comprehensive toolkit for developers.",
    "url": process.env.NEXT_PUBLIC_APP_URL || "https://jsonviewer.app",
    "applicationCategory": "DeveloperApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Any modern web browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "JSON Formatting and Beautification",
      "JSON Validation and Error Detection",
      "Interactive Tree View Navigation",
      "Syntax Highlighting",
      "Real-time Collaboration",
      "JSON Sharing and Publishing",
      "Multiple Export Formats",
      "API Integration",
      "Large File Processing",
      "Mobile-Responsive Interface"
    ],
    "creator": {
      "@type": "Organization",
      "name": "JSON Viewer Team"
    }
  };

  return (
    <MainLayout variant="default">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData, null, 2)
        }}
      />
      
      <div className="min-h-full">
        {/* Hero Section with Integrated Editor and Tabs */}
        <div className="relative bg-gradient-to-b from-background to-muted/30 border-b">
          <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
            {/* Hero Header */}
            <div className="text-center mb-8">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
                <Badge variant="secondary" className="px-2 sm:px-4 py-1 sm:py-2 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Professional JSON Tools
                </Badge>
                <Badge variant="outline" className="px-2 sm:px-4 py-1 sm:py-2 border-primary/30 text-xs sm:text-sm">
                  <Users className="w-3 h-3 mr-1" />
                  For Developers
                </Badge>
              </div>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-6 tracking-tight text-foreground px-4 sm:px-0">
                JSON Viewer, Formatter & Editor
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
                A comprehensive JSON toolkit for developers. Format, validate, visualize, and share JSON data with lightning-fast performance and professional features.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium">100% Free</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium">No Registration</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="font-medium">Works Offline</span>
                </div>
              </div>
            </div>

            {/* Browser-Like Editor with Tabs */}
            <div className="max-w-6xl mx-auto px-2 sm:px-4">
              <Card className="border-2 shadow-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="border-b bg-muted/50 px-2 sm:px-4 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="hidden sm:inline text-sm text-muted-foreground ml-2">json-viewer.io</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      <Play className="w-3 h-3 mr-1" />
                      Live Demo
                    </Badge>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b">
                  <TabsNav 
                    value={activeTab} 
                    onValueChange={(tab) => {
                      setActiveTab(tab);
                      setHasInteractedWithTabs(true);
                      setShowFlowHint(false);
                      if (tab === 'flow') {
                        localStorage.setItem('hasSeenFlowHint', 'true');
                      }
                    }} 
                    showEditor={true}
                    highlightFlow={showFlowHint}
                  />
                </div>

                {/* Subtle Flow View Hint */}
                {showFlowHint && (
                  <div className="relative">
                    <div className="absolute left-1/2 transform -translate-x-1/2 sm:left-32 sm:transform-none -top-14 z-50 animate-in fade-in-0 zoom-in-95 duration-200 w-80 max-w-[calc(100vw-2rem)]">
                      <div 
                        className={`bg-gradient-to-r from-${colors.primary}-50 to-indigo-50 dark:from-${colors.primary}-950/50 dark:to-indigo-950/50 border border-${colors.primary}-200 dark:border-${colors.primary}-800 rounded-lg px-3 py-2 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-200`}
                        onClick={() => {
                          setActiveTab('flow');
                          setHasInteractedWithTabs(true);
                          setShowFlowHint(false);
                          localStorage.setItem('hasSeenFlowHint', 'true');
                        }}
                      >
                        <div className={`flex items-center gap-2 text-sm text-${colors.primary}-700 dark:text-${colors.primary}-300`}>
                          <Sparkles className="h-4 w-4" />
                          <span>Try <strong>Flow</strong> view for visual JSON exploration!</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowFlowHint(false);
                              localStorage.setItem('hasSeenFlowHint', 'true');
                            }}
                            className={`ml-2 text-${colors.primary}-600 hover:text-${colors.primary}-800 dark:text-${colors.primary}-400 dark:hover:text-${colors.primary}-200 hover:bg-${colors.primary}-100 dark:hover:bg-${colors.primary}-800 rounded px-1`}
                          >
                            ×
                          </button>
                        </div>
                        {/* Arrow pointing up to Flow tab */}
                        <div className={`absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gradient-to-br from-${colors.primary}-50 to-indigo-50 dark:from-${colors.primary}-950/50 dark:to-indigo-950/50 border-l border-t border-${colors.primary}-200 dark:border-${colors.primary}-800 rotate-45`}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Area */}
                <CardContent className="p-0">
                  <div className="h-[300px] sm:h-[400px] lg:h-[500px] relative">
                    {activeTab === 'editor' ? (
                      <JsonEditor />
                    ) : (
                      <Viewer
                        content={currentJson}
                        maxNodes={1000}
                        virtualizeThreshold={100}
                        initialViewMode={activeTab as 'tree' | 'list' | 'flow'}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        enableViewModeSwitch={false}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions - Mobile Accessibility Optimized */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 px-4 sm:px-0">
                <Link href="/edit">
                  <Button 
                    size="lg"
                    className="gap-2 text-sm sm:text-base px-4 sm:px-8 w-full sm:w-auto py-3 min-h-[48px] sm:min-h-[40px]" 
                  >
                    <Code2 className="w-5 h-5" />
                    Open Full Editor
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/format">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="gap-2 text-sm px-4 w-full sm:w-auto py-3 min-h-[48px] sm:min-h-[40px]"
                  >
                    <FileJson className="w-5 h-5" />
                    Format JSON
                  </Button>
                </Link>
                <Link href="/compare">
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="gap-2 text-sm px-4 w-full sm:w-auto py-3 min-h-[48px] sm:min-h-[40px]"
                  >
                    <Copy className="w-5 h-5" />
                    Compare JSON
                  </Button>
                </Link>
                <Link href="/convert">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="gap-2 text-sm px-4 w-full sm:w-auto py-3 min-h-[48px] sm:min-h-[40px]"
                  >
                    <ArrowRightLeft className="w-5 h-5" />
                    Convert JSON
                  </Button>
                </Link>
                <Link href="/library">
                  <Button 
                    variant="outline"
                    size="lg"
                    className="gap-2 text-sm px-4 w-full sm:w-auto py-3 min-h-[48px] sm:min-h-[40px]"
                  >
                    <Database className="w-5 h-5" />
                    Browse Examples
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section className="bg-white dark:bg-gray-950" aria-labelledby="features-heading">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
            <header className="text-center mb-16">
              <h2 id="features-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">
                Complete JSON Toolkit
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                Professional tools for modern development workflows
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <Link key={index} href={feature.link}>
                  <Card className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <CardContent className="p-8">
                      <div className="mb-6">
                        <div className={`w-12 h-12 rounded-xl bg-${colors.primary}-50 dark:bg-${colors.primary}-950/30 flex items-center justify-center text-${colors.primary}-600 dark:text-${colors.primary}-400 mb-4 group-hover:bg-${colors.primary}-100 dark:group-hover:bg-${colors.primary}-900/40 transition-colors duration-200`}>
                          {feature.icon}
                        </div>
                        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-2">
                          {feature.title}
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                        {feature.description}
                      </p>
                      <div className={`flex items-center text-${colors.primary}-600 dark:text-${colors.primary}-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-200`}>
                        Explore <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="bg-gray-50 dark:bg-gray-900/50" aria-labelledby="benefits-heading">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-16">
                <h2 id="benefits-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">Why Choose Our Tools</h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  Built for developers who demand speed, reliability, and professional-grade features.
                </p>
              </header>

              <div className="grid md:grid-cols-2 gap-6">
                {benefits.map((benefit, index) => (
                  <Card key={index} className="group border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                    <CardContent className="p-8">
                      <div className="flex items-start gap-6">
                        <div className={`w-14 h-14 rounded-xl bg-${colors.secondary}-50 dark:bg-${colors.secondary}-950/30 flex items-center justify-center text-${colors.secondary}-600 dark:text-${colors.secondary}-400 flex-shrink-0`}>
                          {benefit.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{benefit.title}</h3>
                            <span className={`px-3 py-1 bg-${colors.secondary}-50 dark:bg-${colors.secondary}-950/30 text-${colors.secondary}-700 dark:text-${colors.secondary}-300 text-xs font-medium rounded-full`}>
                              {benefit.stats}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* JSON Education Section */}
        <section className="bg-slate-50 dark:bg-gray-900" aria-labelledby="json-guide-heading">
          <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
            <div className="max-w-6xl mx-auto">
              <header className="text-center mb-8 sm:mb-12 lg:mb-16">
                <h2 id="json-guide-heading" className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-gray-100">What is JSON?</h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 leading-relaxed px-4 sm:px-0">
                  The universal data format powering modern web development
                </p>
              </header>
            
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start lg:items-center">
                <div className="space-y-6 sm:space-y-8 order-2 lg:order-1">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">JSON Fundamentals</h3>
                    <p className="text-muted-foreground leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">
                      <strong>JSON (JavaScript Object Notation)</strong> is the universal data format that powers modern web development. 
                      Created in 2001, JSON has become the standard for data exchange between web applications, APIs, and databases worldwide.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">JSON Advantages</h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                          <li>• Lightweight &amp; fast parsing</li>
                          <li>• Human-readable format</li>
                          <li>• Universal language support</li>
                          <li>• Native JavaScript integration</li>
                          <li>• Smaller than XML (30% less)</li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">Common Uses</h4>
                        <ul className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                          <li>• REST API responses</li>
                          <li>• Configuration files</li>
                          <li>• Data storage &amp; transfer</li>
                          <li>• NoSQL databases</li>
                          <li>• Web app state management</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  <div className={`bg-${colors.primary}-50 dark:bg-${colors.primary}-950/30 rounded-lg p-4 sm:p-6 border border-${colors.primary}-200 dark:border-${colors.primary}-800`}>
                    <h4 className={`font-semibold text-base sm:text-lg mb-3 text-${colors.primary}-900 dark:text-${colors.primary}-100`}>Did You Know?</h4>
                    <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                      <li>• 95% of web APIs use JSON for data exchange</li>
                      <li>• JSON processing is 3x faster than XML</li>
                      <li>• Over 10 billion JSON requests processed daily</li>
                      <li>• Supported by 200+ programming languages</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h4 className="font-semibold text-base sm:text-lg mb-4">JSON Structure Example</h4>
                      <pre className="bg-muted/50 rounded-lg p-3 sm:p-4 text-xs sm:text-sm overflow-x-auto whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
{`{
  "name": "John Doe",
  "age": 30,
  "isActive": true,
  "skills": ["JavaScript", "Python", "JSON"],
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "projects": null
}`}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <h4 className="font-semibold text-base sm:text-lg mb-4">JSON vs Other Formats</h4>
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium">File Size (same data)</span>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">JSON: 1KB</Badge>
                            <Badge variant="outline" className="text-xs">XML: 1.3KB</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium">Parse Speed</span>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">JSON: 0.1ms</Badge>
                            <Badge variant="outline" className="text-xs">XML: 0.3ms</Badge>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                          <span className="text-xs sm:text-sm font-medium">Readability</span>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">JSON: Excellent</Badge>
                            <Badge variant="outline" className="text-xs">XML: Good</Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="bg-muted/30" aria-labelledby="use-cases-heading">
          <div className="container mx-auto px-6 py-16">
            <header className="text-center mb-12">
              <h2 id="use-cases-heading" className="text-3xl md:text-4xl font-bold mb-4">Perfect for Every Development Workflow</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                From startup MVPs to enterprise applications, our JSON tools adapt to your needs and scale with your growth.
              </p>
            </header>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {useCases.map((useCase, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {useCase.icon}
                      <h3 className="font-semibold text-lg">{useCase.title}</h3>
                    </div>
                    <p className="text-muted-foreground mb-4 text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                    <div className="space-y-2">
                      {useCase.tools.map((tool, toolIndex) => (
                        <div key={toolIndex} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Check className={`w-3 h-3 text-${colors.secondary}-600 dark:text-${colors.secondary}-400 flex-shrink-0`} />
                          <span>{tool}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="bg-background" aria-labelledby="comparison-heading">
          <div className="container mx-auto px-6 py-16">
            <header className="max-w-4xl mx-auto text-center mb-12">
              <h2 id="comparison-heading" className="text-3xl md:text-4xl font-bold mb-4">Why We&apos;re Better Than The Rest</h2>
              <p className="text-xl text-muted-foreground">
                Don&apos;t settle for basic JSON tools. See how we compare to popular alternatives.
              </p>
            </header>

            <div className="max-w-4xl mx-auto">
              <Card>
                <CardContent className="p-0">
                  <div className="grid grid-cols-3 gap-0">
                    <div className="p-4 bg-muted/30 font-semibold">Competitor</div>
                    <div className="p-4 bg-muted/30 font-semibold">Their Offering</div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100">Our Advantage</div>
                  </div>
                  {competitors.map((comp, index) => (
                    <div key={index} className="grid grid-cols-3 gap-0 border-t">
                      <div className="p-4 font-medium">{comp.name}</div>
                      <div className="p-4 text-muted-foreground">{comp.feature}</div>
                      <div className="p-4 text-gray-900 dark:text-gray-100 font-medium bg-gray-50 dark:bg-gray-800/50">{comp.us}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-center mt-8">
                <Link href="/edit">
                  <Button size="lg" className="gap-2">
                    Try Our Superior JSON Tools
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-background" aria-labelledby="faq-heading">
          <div className="container mx-auto px-6 py-20">
            <div className="max-w-4xl mx-auto">
              <header className="text-center mb-16">
                <h2 id="faq-heading" className="text-3xl md:text-4xl font-bold mb-6 tracking-tight">Frequently Asked Questions</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Everything you need to know about JSON and our tools
                </p>
              </header>

              <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
                {faqs.map((faq, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow duration-200" itemScope itemType="https://schema.org/Question">
                    <CardContent className="p-4 sm:p-6">
                      <h3 className="font-semibold text-lg mb-3" itemProp="name">
                        {faq.question}
                      </h3>
                      <div itemScope itemType="https://schema.org/Answer" itemProp="acceptedAnswer">
                        <p className="text-muted-foreground leading-relaxed text-sm" itemProp="text">{faq.answer}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="bg-gray-50 dark:bg-gray-900/50 border-t" aria-labelledby="cta-heading">
          <div className="container mx-auto px-6 py-16">
            <div className="text-center max-w-4xl mx-auto">
              <h2 id="cta-heading" className="text-3xl md:text-4xl font-bold mb-6">
                Professional JSON Tools for Developers
              </h2>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Stop struggling with basic JSON validators. Get the complete toolkit for modern development workflows. 
                Start formatting, validating, and visualizing your JSON data like a pro - completely free, no registration required.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <Link href="/edit">
                  <Button size="lg" className="gap-2 text-lg px-8 py-3">
                    <Code2 className="w-5 h-5" />
                    Open JSON Editor
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/format">
                  <Button size="lg" variant="outline" className="gap-2 text-lg px-8 py-3">
                    <FileJson className="w-5 h-5" />
                    Format JSON Now
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Professional grade
                </div>
                <div className="flex items-center gap-2">
                  <Users className={`w-4 h-4 text-${colors.primary}-500`} />
                  For developers
                </div>
                <div className="flex items-center gap-2">
                  <Shield className={`w-4 h-4 text-${colors.secondary}-500`} />
                  100% secure
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Floating CTA */}
        {isScrolled && (
          <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5">
            <Link href="/edit">
              <Button size="lg" className="shadow-2xl gap-2">
                <Code2 className="w-4 h-4" />
                Open Editor
              </Button>
            </Link>
          </div>
        )}
      </div>
    </MainLayout>
  );
}