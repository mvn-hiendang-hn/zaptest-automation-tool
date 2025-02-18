
import { useState } from "react";
import { RequestBuilder, type RequestData } from "@/components/RequestBuilder";
import { ResponseViewer } from "@/components/ResponseViewer";
import { useToast } from "@/components/ui/use-toast";

const Index = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const handleRequest = async (requestData: RequestData) => {
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const headers = new Headers();
      Object.entries(requestData.headers).forEach(([key, value]) => {
        headers.append(key, value);
      });

      if (requestData.body) {
        headers.append("Content-Type", "application/json");
      }

      const response = await fetch(requestData.url, {
        method: requestData.method,
        headers,
        body: requestData.body ? requestData.body : undefined,
      });

      const duration = Math.round(performance.now() - startTime);
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setResponse({
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
        data,
        duration,
      });
    } catch (error) {
      console.error("Request error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Request failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8 slide-in">
          <h1 className="text-3xl font-semibold mb-2">API Testing Tool</h1>
          <p className="text-muted-foreground">
            Test and debug your API endpoints with ease
          </p>
        </div>

        <RequestBuilder onSubmit={handleRequest} isLoading={isLoading} />
        {response && <ResponseViewer response={response} />}
      </div>
    </div>
  );
};

export default Index;
