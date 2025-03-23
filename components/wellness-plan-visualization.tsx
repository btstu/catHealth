"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"

type WellnessPlanData = {
  healthRecommendations: {
    nutrition: string;
    exercise: string;
    preventiveCare: string;
    environment: string;
  };
  behaviorTraining: Record<string, string>;
  enrichmentPlan: {
    play: string;
    toys: string;
    environment: string;
    social: string;
    rest: string;
  };
  followUpSchedule: Array<{week: number, tasks: string[]}>;
};

type WellnessPlanVisualizationProps = {
  data: WellnessPlanData;
  catName: string;
};

export default function WellnessPlanVisualization({ data, catName }: WellnessPlanVisualizationProps) {
  const [activeTab, setActiveTab] = useState<'health' | 'behavior' | 'enrichment' | 'schedule'>('health');
  
  if (!data) {
    return <div className="p-4 text-center">No visualization data available</div>;
  }
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent mb-6 text-center">
        {catName}'s Wellness Plan
      </h2>
      
      {/* Tabs */}
      <div className="flex flex-wrap mb-6 gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'health' ? 'bg-white shadow-md text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('health')}
        >
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19.8 9a2 2 0 0 0-1.8-1h-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1H8a2 2 0 0 0-1.8 1 2 2 0 0 0 .2 2.2l3.4 3.4a2 2 0 0 0 .9.4V17a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0 .8-.4l3.4-3.4a2 2 0 0 0 .1-2.2Z"></path>
            </svg>
            Health
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'behavior' ? 'bg-white shadow-md text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('behavior')}
        >
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-5 0v-15A2.5 2.5 0 0 1 9.5 2Z"></path>
              <path d="M14.5 8A2.5 2.5 0 0 1 17 10.5v9a2.5 2.5 0 0 1-5 0v-9A2.5 2.5 0 0 1 14.5 8Z"></path>
              <path d="M19.5 14a2.5 2.5 0 0 1 2.5 2.5v3a2.5 2.5 0 0 1-5 0v-3a2.5 2.5 0 0 1 2.5-2.5Z"></path>
            </svg>
            Behavior
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'enrichment' ? 'bg-white shadow-md text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('enrichment')}
        >
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
            Enrichment
          </div>
        </button>
        <button
          className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-white shadow-md text-blue-700' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('schedule')}
        >
          <div className="flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Schedule
          </div>
        </button>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        {activeTab === 'health' && (
          <div className="space-y-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 relative">
                <Image
                  src="/comfy.svg"
                  alt="Healthy Cat"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 3H10a5 5 0 0 0-5 5v13a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3V8a5 5 0 0 0-5-5Z"></path>
                        <line x1="10" x2="16" y1="10" y2="10"></line>
                        <line x1="13" x2="13" y1="7" y2="13"></line>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-purple-700 to-purple-500 bg-clip-text text-transparent">Nutrition</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.healthRecommendations.nutrition}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 22h2a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4H10a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h2"></path>
                        <rect width="10" height="12" x="7" y="2" rx="5"></rect>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">Exercise</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.healthRecommendations.exercise}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19.8 9a2 2 0 0 0-1.8-1h-2V7a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v1H8a2 2 0 0 0-1.8 1 2 2 0 0 0 .2 2.2l3.4 3.4a2 2 0 0 0 .9.4V17a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0 .8-.4l3.4-3.4a2 2 0 0 0 .1-2.2Z"></path>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-green-700 to-green-500 bg-clip-text text-transparent">Preventive Care</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.healthRecommendations.preventiveCare}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                        <polyline points="9 22 9 12 15 12 15 22"></polyline>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">Environment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.healthRecommendations.environment}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'behavior' && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 relative">
                <Image
                  src={Object.keys(data.behaviorTraining).length > 0 ? "/angry.svg" : "/playfull.svg"}
                  alt="Behavior Cat"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            {Object.entries(data.behaviorTraining).length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {Object.entries(data.behaviorTraining).map(([issue, recommendation], index) => (
                  <Card key={index} className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                    <CardHeader className="pb-2 bg-gradient-to-r from-blue-50 to-indigo-100">
                      <CardTitle className="text-lg flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mr-2 text-white">
                          <span className="font-bold">{index + 1}</span>
                        </div>
                        <span className="bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">{issue}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-gray-700">{recommendation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-green-50 rounded-xl border border-green-100">
                <h3 className="text-lg font-semibold text-green-700 mb-3">No behavior issues to address!</h3>
                <p className="text-green-600">Your cat seems to be doing great behaviorally.</p>
                <div className="mt-6 w-24 h-24 mx-auto relative">
                  <Image
                    src="/playfull.svg"
                    alt="Happy Cat"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'enrichment' && (
          <div className="space-y-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 relative">
                <Image
                  src="/playing.svg"
                  alt="Playing Cat"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-green-50 to-emerald-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-green-700 to-emerald-600 bg-clip-text text-transparent">Play</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.enrichmentPlan.play}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-violet-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="8" height="8" x="8" y="8" rx="2"></rect>
                        <path d="M12 2v2"></path>
                        <path d="M12 20v2"></path>
                        <path d="M20 12h2"></path>
                        <path d="M2 12h2"></path>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-indigo-700 to-violet-700 bg-clip-text text-transparent">Toys</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.enrichmentPlan.toys}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-cyan-50 to-blue-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="16" height="13" x="4" y="3" rx="2"></rect>
                        <path d="M8 21h8"></path>
                        <path d="M12 16v5"></path>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">Environment</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.enrichmentPlan.environment}</p>
                </CardContent>
              </Card>
              
              <Card className="overflow-hidden border-none shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-2 bg-gradient-to-r from-pink-50 to-rose-100">
                  <CardTitle className="text-lg flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 flex items-center justify-center mr-2 text-white">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                      </svg>
                    </div>
                    <span className="bg-gradient-to-r from-pink-700 to-rose-700 bg-clip-text text-transparent">Social Interaction</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{data.enrichmentPlan.social}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        
        {activeTab === 'schedule' && (
          <div className="space-y-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 relative">
                <Image
                  src="/busy.svg"
                  alt="Schedule"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            
            <div className="relative pb-6">
              {/* Timeline line */}
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full"></div>
              
              {/* Timeline items */}
              <div className="space-y-12">
                {data.followUpSchedule.sort((a, b) => a.week - b.week).map((week, index) => (
                  <div key={index} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/4 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 border-4 border-white shadow-md flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{week.week}</span>
                    </div>
                    
                    <Card className={`w-full max-w-lg mx-auto border-none shadow-md ${index % 2 === 0 ? 'ml-4 md:ml-auto md:mr-0' : 'mr-4 md:mr-auto md:ml-0'}`}>
                      <CardHeader className="pb-2 bg-gradient-to-r from-amber-50 to-amber-100">
                        <CardTitle className="flex items-center">
                          <span className="bg-gradient-to-r from-amber-700 to-amber-600 bg-clip-text text-transparent">
                            Week {week.week}
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {week.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-start gap-2">
                              <div className="w-5 h-5 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center mt-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              </div>
                              <span className="text-gray-700">{task}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 