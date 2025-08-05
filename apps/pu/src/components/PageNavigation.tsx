import Editor from '@monaco-editor/react'
import katex from 'katex'
import { BookOpen, Calculator, Code, Eye, Info, Target } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import 'katex/dist/katex.min.css'
import { useEffect, useRef } from 'react'

interface PageNavigationProps {
  title: string
  overview: {
    description: string
    features: Array<{
      title: string
      description: string
      color?: string
    }>
  }
  applications: Array<{
    title: string
    description: string
    color?: string
  }>
  tutorial: {
    description: string
    steps: Array<{
      title: string
      items: string[]
      color?: string
    }>
    tips?: string[]
  }
  mathematics: {
    description: string
    sections: Array<{
      title: string
      content: React.ReactNode
      formulas?: Array<{
        label: string
        latex: string
        description?: string
      }>
    }>
  }
  pytorch: {
    description: string
    sections: Array<{
      title: string
      content: React.ReactNode
      codeExample?: {
        title: string
        code: string
        explanation?: string
      }
    }>
  }
}

// LaTeX 公式組件
function LaTeXFormula({ formula, className = '' }: { formula: string; className?: string }) {
  const divRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (divRef.current) {
      try {
        katex.render(formula, divRef.current, {
          throwOnError: false,
          displayMode: true,
        })
      } catch (error) {
        console.error('KaTeX render error:', error)
        divRef.current.textContent = formula
      }
    }
  }, [formula])

  return <div ref={divRef} className={`text-center ${className}`} />
}

// 程式碼編輯器組件
function CodeEditor({
  code,
  language = 'python',
  height = '400px',
  readOnly = true,
}: {
  code: string
  language?: string
  height?: string
  readOnly?: boolean
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Editor
        height={height}
        defaultLanguage={language}
        value={code}
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          automaticLayout: true,
          theme: 'vs-dark',
        }}
      />
    </div>
  )
}

export default function PageNavigation({
  title,
  overview,
  applications,
  tutorial,
  mathematics,
  pytorch,
}: PageNavigationProps) {
  return (
    <div className="mt-16">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">功能概覽</TabsTrigger>
          <TabsTrigger value="applications">應用領域</TabsTrigger>
          <TabsTrigger value="tutorial">操作指南</TabsTrigger>
          <TabsTrigger value="mathematics">數學原理</TabsTrigger>
          <TabsTrigger value="pytorch">PyTorch 實作</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {title} 功能概覽
              </CardTitle>
              <CardDescription>{overview.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {overview.features.map(feature => (
                  <div key={feature.title} className="space-y-2">
                    <h4 className={`font-semibold mb-3 ${feature.color || 'text-blue-600'}`}>
                      {feature.title}
                    </h4>
                    <div className="text-sm text-muted-foreground">{feature.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                實際應用領域
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {applications.map(app => (
                  <div key={app.title} className="p-4 border rounded-lg">
                    <h5 className={`font-medium mb-2 ${app.color || 'text-blue-600'}`}>
                      {app.title}
                    </h5>
                    <p className="text-sm text-muted-foreground">{app.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorial" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                互動操作指南
              </CardTitle>
              <CardDescription>{tutorial.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tutorial.steps.map(step => (
                    <div key={step.title}>
                      <h5 className={`font-medium mb-2 ${step.color || 'text-blue-600'}`}>
                        {step.title}
                      </h5>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        {step.items.map(item => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {tutorial.tips && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      使用技巧
                    </h4>
                    <ul className="text-sm space-y-1">
                      {tutorial.tips.map(tip => (
                        <li key={tip}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mathematics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{mathematics.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {mathematics.sections.map(section => (
                  <div key={section.title}>
                    <h4 className="font-semibold mb-4">{section.title}</h4>
                    <div className="space-y-4">{section.content}</div>

                    {section.formulas && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2">重要公式</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          {section.formulas.map(formula => (
                            <div key={formula.label}>
                              <p>
                                <strong>{formula.label}：</strong>
                              </p>
                              <div className="bg-white p-4 rounded mt-1">
                                <LaTeXFormula formula={formula.latex} />
                              </div>
                              {formula.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formula.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pytorch" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {title} PyTorch 實作
              </CardTitle>
              <CardDescription>{pytorch.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {pytorch.sections.map(section => (
                  <div key={section.title}>
                    <h4 className="font-semibold mb-4">{section.title}</h4>
                    <div className="space-y-4">{section.content}</div>

                    {section.codeExample && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-2">{section.codeExample.title}</h4>
                        <div className="mt-3">
                          <CodeEditor
                            code={section.codeExample.code}
                            language="python"
                            height="300px"
                          />
                        </div>
                        {section.codeExample.explanation && (
                          <p className="text-sm text-muted-foreground mt-3">
                            {section.codeExample.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
