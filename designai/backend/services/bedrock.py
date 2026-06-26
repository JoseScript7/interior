"""
Bedrock Service Wrapper
Handles Claude Converse API calls with retry logic
"""
import os
import json
import time
import boto3
from aws_lambda_powertools import Logger

logger = Logger(child=True)

BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
MAX_RETRIES = 2
RETRY_DELAY = 2


class BedrockService:
    def __init__(self):
        self.client = boto3.client("bedrock-runtime", region_name=os.environ.get("AWS_REGION_NAME", "us-east-1"))

    def converse(self, system_prompt: str, user_content: list, max_tokens: int = 4096, temperature: float = 0.7) -> str:
        """Call Bedrock Converse API with retry logic"""
        for attempt in range(MAX_RETRIES + 1):
            try:
                response = self.client.converse(
                    modelId=BEDROCK_MODEL_ID,
                    system=[{"text": system_prompt}],
                    messages=[{"role": "user", "content": user_content}],
                    inferenceConfig={"maxTokens": max_tokens, "temperature": temperature},
                )
                return response["output"]["message"]["content"][0]["text"]
            except Exception as e:
                logger.warning(f"Bedrock call failed (attempt {attempt + 1}): {e}")
                if attempt < MAX_RETRIES:
                    time.sleep(RETRY_DELAY * (attempt + 1))
                else:
                    raise

    def converse_with_image(self, system_prompt: str, image_bytes: bytes, image_format: str, user_text: str, max_tokens: int = 4096, temperature: float = 0.7) -> str:
        """Call Bedrock with multimodal image + text"""
        user_content = [
            {"image": {"format": image_format, "source": {"bytes": image_bytes}}},
            {"text": user_text},
        ]
        return self.converse(system_prompt, user_content, max_tokens, temperature)

    def generate_embedding(self, text: str) -> list[float]:
        """Generate text embedding using Titan"""
        response = self.client.invoke_model(
            modelId="amazon.titan-embed-image-v1",
            body=json.dumps({"inputText": text}),
            contentType="application/json",
        )
        result = json.loads(response["body"].read())
        return result.get("embedding", [])


# Singleton
bedrock_service = BedrockService()
