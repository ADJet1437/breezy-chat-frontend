import React from 'react';
import { Database, GitBranch, Workflow, Plug, BarChart3, Server, CheckCircle2 } from 'lucide-react';

export const ServicesSection: React.FC = () => {
  return (
    <section id="gallery" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Expert System Development
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We build intelligent systems that transform your business operations with cutting-edge AI technology
          </p>
        </div>

        {/* Services Value Table */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* RAG Systems */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Database className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">RAG Systems</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Retrieval-Augmented Generation systems that connect your AI to proprietary data sources.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Custom embedding strategies for your domain</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Vector database optimization & management</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Multi-source document ingestion pipelines</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span>Semantic search with contextual relevance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Agentic AI Applications */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GitBranch className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Agentic AI Coding</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Autonomous AI agents that understand natural language prompts and build complete applications.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>Prompt-to-application development systems</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>Multi-agent orchestration frameworks</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>Automated testing & code review agents</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0 mt-0.5" />
                      <span>Self-healing & adaptive code systems</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Process Automation */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Workflow className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Process Automation</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    End-to-end workflow automation that eliminates manual tasks and accelerates operations.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Business process analysis & redesign</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Intelligent workflow orchestration</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Document processing & data extraction</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Event-driven automation pipelines</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* System Integrations */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Plug className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Enterprise Integrations</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Seamless connections between your existing tools, platforms, and data sources.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>API design & development</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Legacy system modernization</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Third-party service integration</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span>Real-time data synchronization</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Analysis */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Data Analysis & BI</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Transform raw data into actionable insights with AI-powered analytics platforms.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>Custom analytics dashboards</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>Predictive modeling & forecasting</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>Natural language query interfaces</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <span>Automated reporting systems</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* On-Premises Deployment */}
            <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Server className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">On-Premises Setup</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-3">
                    Secure, private AI deployments within your infrastructure with full data sovereignty.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span>Private cloud & on-prem installations</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span>Air-gapped environment support</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span>Compliance & security hardening</span>
                    </li>
                    <li className="flex items-start text-xs text-gray-600">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-gray-700 flex-shrink-0 mt-0.5" />
                      <span>Custom model fine-tuning & hosting</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Value Proposition Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            End-to-End Implementation & Support
          </h3>
          <p className="text-blue-100 text-lg max-w-3xl mx-auto">
            From initial consultation to deployment and maintenance, we deliver complete solutions that integrate seamlessly with your existing systems and scale with your business needs.
          </p>
        </div>
      </div>
    </section>
  );
};
