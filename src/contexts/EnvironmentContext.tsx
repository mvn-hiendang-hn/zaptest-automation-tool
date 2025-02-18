
import React, { createContext, useContext, useState } from "react";

type Environment = {
  name: string;
  variables: Record<string, string>;
};

type EnvironmentContextType = {
  environments: Environment[];
  currentEnv: Environment | null;
  setCurrentEnv: (env: Environment | null) => void;
  addEnvironment: (env: Environment) => void;
};

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

export function EnvironmentProvider({ children }: { children: React.ReactNode }) {
  const [environments, setEnvironments] = useState<Environment[]>([
    {
      name: "Development",
      variables: {
        "base_url": "https://api.dev.example.com",
      },
    },
  ]);
  const [currentEnv, setCurrentEnv] = useState<Environment | null>(environments[0]);

  const addEnvironment = (env: Environment) => {
    setEnvironments([...environments, env]);
  };

  return (
    <EnvironmentContext.Provider 
      value={{ environments, currentEnv, setCurrentEnv, addEnvironment }}
    >
      {children}
    </EnvironmentContext.Provider>
  );
}

export const useEnvironment = () => {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
};
