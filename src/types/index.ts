export interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  type?: string;
  price_level?: string;
  district?: string;
  address?: string;
  rating?: number;
  why?: string;
}

export type MessageRole = "user" | "assistant";

export interface Message {
  role: MessageRole;
  text: string;
}

export interface SearchParams {
  city: string;
  cuisine?: string;
  budget?: string;
  district?: string;
  page?: number;
}
