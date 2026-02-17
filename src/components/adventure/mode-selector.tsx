"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function AdventureModeSelector() {
  const [selectedMode, setSelectedMode] = useState<"classic" | "true-mas">("classic");

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Select Adventure Mode</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Classic Mode */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedMode === "classic"
                ? "border-blue-500 border-2 bg-blue-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => setSelectedMode("classic")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🎮 Classic Mode</CardTitle>
                {selectedMode === "classic" && <Badge variant="default">Selected</Badge>}
              </div>
              <CardDescription>Orchestrated Multi-Agent System</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Architecture:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>✓ Central Orchestrator</li>
                  <li>✓ 4 Coordinated Agents</li>
                  <li>✓ Deterministic Flow</li>
                  <li>✓ Easy to Debug</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Best For:</h4>
                <p className="text-sm text-gray-600">
                  Stable gameplay, predictable behavior, easier debugging
                </p>
              </div>
            </CardContent>
          </Card>

          {/* True MAS Mode */}
          <Card
            className={`cursor-pointer transition-all ${
              selectedMode === "true-mas"
                ? "border-purple-500 border-2 bg-purple-50"
                : "border-gray-200 hover:border-gray-400"
            }`}
            onClick={() => setSelectedMode("true-mas")}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>🤖 True MAS Mode</CardTitle>
                {selectedMode === "true-mas" && <Badge variant="default">Selected</Badge>}
              </div>
              <CardDescription>True Multi-Agent System (NEW!)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold text-sm mb-2">Architecture:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>✨ Generalist Agent (Long Reasoning)</li>
                  <li>✨ 4 Specialist Agents (Short Reasoning)</li>
                  <li>✨ Decentralized Message Bus</li>
                  <li>✨ Hierarchical Model</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Best For:</h4>
                <p className="text-sm text-gray-600">
                  Research, understanding real MAS, advanced AI demonstrations
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mode Details */}
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedMode === "classic" ? "🎮 Classic Mode" : "🤖 True MAS Mode"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedMode === "classic" ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>How it works:</strong> A central orchestrator coordinates 4 agents
                  working together in a predetermined sequence.
                </p>
                <p>
                  <strong>Communication:</strong> All agents communicate through the lead
                  orchestrator.
                </p>
                <p>
                  <strong>Decision Making:</strong> Weighted voting with orchestrator oversight.
                </p>
                <p>
                  <strong>API Endpoints:</strong> <code>/api/adventure/*</code>
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>How it works:</strong> A Generalist Agent with long reasoning
                  strategizes, while 4 specialist agents execute using short reasoning and
                  tools.
                </p>
                <p>
                  <strong>Communication:</strong> Fully decentralized message bus - agents
                  publish topics and subscribe to topics they care about.
                </p>
                <p>
                  <strong>Decision Making:</strong> Generalist decides strategy, specialists
                  autonomously implement, emergent consensus.
                </p>
                <p>
                  <strong>API Endpoints:</strong> <code>/api/adventure-mas/*</code>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            const params = new URLSearchParams();
            params.set("mode", selectedMode);
            window.location.href = `/adventure?${params.toString()}`;
          }}
        >
          {selectedMode === "classic" ? "🎮 Start Classic Adventure" : "🤖 Start True MAS Adventure"}
        </Button>

        {/* Comparison Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Architecture Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Feature</th>
                    <th className="text-center p-2">Classic</th>
                    <th className="text-center p-2">True MAS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Hierarchical</td>
                    <td className="text-center">✓</td>
                    <td className="text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Decentralized</td>
                    <td className="text-center">✗</td>
                    <td className="text-center">✓</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Central Controller</td>
                    <td className="text-center">Orchestrator</td>
                    <td className="text-center">None</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Long Reasoning</td>
                    <td className="text-center">✗</td>
                    <td className="text-center">✓ (Generalist)</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Message Bus</td>
                    <td className="text-center">Orchestrator</td>
                    <td className="text-center">Pub/Sub</td>
                  </tr>
                  <tr>
                    <td className="p-2">Debugging</td>
                    <td className="text-center">Easy</td>
                    <td className="text-center">Complex</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
