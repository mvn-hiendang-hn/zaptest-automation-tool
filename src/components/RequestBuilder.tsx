
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];

export type RequestData = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
};

interface RequestBuilderProps {
  onSubmit: (data: RequestData) => void;
  isLoading: boolean;
}

export const RequestBuilder = ({ onSubmit, isLoading }: RequestBuilderProps) => {
  const { toast } = useToast();
  const [method, setMethod] = useState("GET");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: "", value: "" },
  ]);
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) {
      toast({
        title: "Error",
        description: "Please enter a URL",
        variant: "destructive",
      });
      return;
    }

    const processedHeaders = headers.reduce((acc, { key, value }) => {
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    onSubmit({
      method,
      url,
      headers: processedHeaders,
      body: body.trim(),
    });
  };

  const addHeader = () => {
    setHeaders([...headers, { key: "", value: "" }]);
  };

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const newHeaders = [...headers];
    newHeaders[index][field] = value;
    setHeaders(newHeaders);
  };

  return (
    <Card className="glass w-full mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Request Builder</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                {HTTP_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Headers</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addHeader}
              >
                Add Header
              </Button>
            </div>
            {headers.map((header, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Key"
                  value={header.key}
                  onChange={(e) => updateHeader(index, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Value"
                  value={header.value}
                  onChange={(e) => updateHeader(index, "value", e.target.value)}
                  className="flex-1"
                />
              </div>
            ))}
          </div>

          {method !== "GET" && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Request Body</h3>
              <Textarea
                placeholder="Enter request body (JSON)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="min-h-[100px] font-mono text-sm"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
