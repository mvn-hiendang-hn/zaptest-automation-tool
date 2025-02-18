
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponseViewerProps {
  response: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
    duration: number;
  } | null;
}

export const ResponseViewer = ({ response }: ResponseViewerProps) => {
  const [activeTab, setActiveTab] = useState<"body" | "headers">("body");
  const [formattedResponse, setFormattedResponse] = useState("");

  useEffect(() => {
    if (response?.data) {
      try {
        setFormattedResponse(
          JSON.stringify(response.data, null, 2)
        );
      } catch (e) {
        setFormattedResponse(String(response.data));
      }
    }
  }, [response]);

  if (!response) {
    return null;
  }

  const getStatusColor = (status: number) => {
    if (status < 300) return "bg-green-500";
    if (status < 400) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="glass w-full fade-in">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Response</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`${getStatusColor(response.status)} text-white`}
            >
              {response.status} {response.statusText}
            </Badge>
            <Badge variant="outline">{response.duration}ms</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeTab === "body" ? "default" : "ghost"}
            onClick={() => setActiveTab("body")}
          >
            Body
          </Button>
          <Button
            variant={activeTab === "headers" ? "default" : "ghost"}
            onClick={() => setActiveTab("headers")}
          >
            Headers
          </Button>
        </div>

        <ScrollArea className="h-[400px] rounded-md border">
          {activeTab === "body" ? (
            <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
              {formattedResponse}
            </pre>
          ) : (
            <div className="p-4 space-y-2">
              {Object.entries(response.headers).map(([key, value]) => (
                <div key={key} className="flex">
                  <span className="font-medium min-w-[200px]">{key}:</span>
                  <span className="text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

import { Button } from "@/components/ui/button";

export const Button = Button;
