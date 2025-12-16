import { useState, useCallback } from "react";
import { api } from "@/lib/api";
import { SQS_ENDPOINTS } from "@/lib/config";
import { Queue, Message } from "@/types";

export function useSQS() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueues = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Queue[] }>(SQS_ENDPOINTS.queues);
      setQueues(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queues");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createQueue = async (name: string) => {
    const response = await api.post<{ data: Queue }>(SQS_ENDPOINTS.queues, { name });
    setQueues((prev) => [...prev, response.data]);
    return response.data;
  };

  const deleteQueue = async (id: string) => {
    await api.delete(SQS_ENDPOINTS.queueById(id));
    setQueues((prev) => prev.filter((q) => q.id !== id));
  };

  return {
    queues,
    isLoading,
    error,
    fetchQueues,
    createQueue,
    deleteQueue,
  };
}

export function useQueueMessages(queueId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!queueId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: Message[] }>(
        SQS_ENDPOINTS.messages(queueId)
      );
      setMessages(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setIsLoading(false);
    }
  }, [queueId]);

  const sendMessage = async (body: string) => {
    const response = await api.post<{ data: Message }>(
      SQS_ENDPOINTS.messages(queueId),
      { body }
    );
    setMessages((prev) => [...prev, response.data]);
    return response.data;
  };

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
  };
}
