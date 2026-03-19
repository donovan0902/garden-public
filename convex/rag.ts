import { components } from "./_generated/api";
import { RAG } from "@convex-dev/rag";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export const rag = new RAG(components.rag, {
  textEmbeddingModel: bedrock.embedding("us.cohere.embed-v4:0"),
  embeddingDimension: 1536,
});

