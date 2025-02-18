
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnvironment } from "@/contexts/EnvironmentContext";

interface RequestTabsProps {
  params: Record<string, string>;
  setParams: (params: Record<string, string>) => void;
  auth: {
    type: "none" | "basic" | "bearer";
    token?: string;
    username?: string;
    password?: string;
  };
  setAuth: (auth: any) => void;
}

export function RequestTabs({ params, setParams, auth, setAuth }: RequestTabsProps) {
  const { currentEnv } = useEnvironment();
  const [activeTab, setActiveTab] = useState("params");

  return (
    <Card className="mt-4">
      <Tabs defaultValue="params" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="auth">Authorization</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="env">Environment</TabsTrigger>
        </TabsList>
        <TabsContent value="params" className="p-4">
          <h3 className="text-sm font-medium mb-2">Query Parameters</h3>
          <div className="space-y-2">
            {/* Params content */}
          </div>
        </TabsContent>
        <TabsContent value="auth" className="p-4">
          <h3 className="text-sm font-medium mb-2">Authorization</h3>
          {/* Auth content */}
        </TabsContent>
        <TabsContent value="headers" className="p-4">
          <h3 className="text-sm font-medium mb-2">Headers</h3>
          {/* Headers content */}
        </TabsContent>
        <TabsContent value="env" className="p-4">
          <h3 className="text-sm font-medium mb-2">Current Environment: {currentEnv?.name || "None"}</h3>
          <div className="space-y-2">
            {currentEnv && Object.entries(currentEnv.variables).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <span className="font-medium">{key}:</span>
                <span className="text-muted-foreground">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
