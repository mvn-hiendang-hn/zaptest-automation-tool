
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Book,
  FolderOpen,
  Github,
  Import,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";

export const Sidebar = () => {
  return (
    <div className="w-[280px] border-r bg-muted/10 flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <img
            src="/lovable-uploads/6f825db2-4a3e-4c78-8dcf-996d01055568.png"
            alt="Logo"
            className="w-8 h-8"
          />
          <h1 className="font-semibold">API Testing Tool</h1>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search collections..."
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-4">
          <div>
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Collections
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Plus size={16} />
                Create Collection
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <FolderOpen size={16} />
                Open Collection
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Import size={16} />
                Import Collection
              </Button>
            </div>
          </div>

          <div>
            <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
              Links
            </h2>
            <div className="space-y-1">
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Book size={16} />
                Documentation
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <AlertCircle size={16} />
                Report Issues
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2">
                <Github size={16} />
                GitHub
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
