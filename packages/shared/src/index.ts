export interface ClientConfig {
  name: string;
  tone?: string;
  greeting?: string;
  model?: string;
  max_tokens?: number;
  business_info?: {
    address?: string;
    phone?: string;
    email?: string;
  };
  services?: Array<{
    name: string;
    price: string;
    description: string;
  }>;
  hours?: Array<{
    day: string;
    open: string;
    close: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  policies?: string[];
}

export interface ChatBotConfig {
  port?: number;
  openrouterKey: string;
  openrouterBaseUrl?: string;
  clients: Record<string, ClientConfig>;
  allowedOrigins?: string[];
}
