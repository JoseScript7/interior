"""
U0 Pre-flight: verify required Bedrock models are actually INVOCABLE before deploy.

Why invoke instead of checking modelLifecycleStatus:
  In some accounts (incl. this sandbox) list_foundation_models returns null
  statuses, and modern Claude requires an INFERENCE PROFILE (the bare model id
  is not on-demand invocable). The only reliable gate is a real, tiny invoke.

Checks:
  - Claude via inference profile  us.anthropic.claude-sonnet-4-6   (Converse)
  - Titan embeddings               amazon.titan-embed-image-v1     (InvokeModel)
    and reports the embedding dimension (must match OpenSearch knn mapping).

Usage:
  python -m scripts.preflight_bedrock
  python -m scripts.preflight_bedrock --region us-east-1

Exit 0 = all required models invocable; non-zero = at least one blocking.
"""
import argparse
import json
import os
import sys

import boto3

CLAUDE_PROFILE = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-6")
TITAN_MODEL = os.environ.get("TITAN_EMBED_MODEL", "amazon.titan-embed-image-v1")
EXPECTED_EMBED_DIM = int(os.environ.get("EMBED_DIM", "1024"))


def check(region: str) -> int:
    br = boto3.client("bedrock-runtime", region_name=region)
    failures = []

    # 1) Claude via inference profile
    try:
        r = br.converse(
            modelId=CLAUDE_PROFILE,
            messages=[{"role": "user", "content": [{"text": "Reply with the single word: OK"}]}],
            inferenceConfig={"maxTokens": 5, "temperature": 0},
        )
        txt = r["output"]["message"]["content"][0]["text"].strip()
        print(f"  [OK ] {CLAUDE_PROFILE} -> invocable (said '{txt}')")
    except Exception as e:  # noqa: BLE001
        print(f"  [XX ] {CLAUDE_PROFILE} -> {type(e).__name__}: {str(e)[:200]}")
        failures.append(CLAUDE_PROFILE)

    # 2) Titan embeddings + dimension check
    try:
        r = br.invoke_model(
            modelId=TITAN_MODEL,
            body=json.dumps({"inputText": "preflight"}),
            contentType="application/json",
            accept="application/json",
        )
        dim = len(json.loads(r["body"].read()).get("embedding", []))
        if dim == EXPECTED_EMBED_DIM:
            print(f"  [OK ] {TITAN_MODEL} -> invocable (dim={dim})")
        else:
            print(f"  [XX ] {TITAN_MODEL} -> dim {dim} != expected {EXPECTED_EMBED_DIM} (fix OpenSearch mapping/contracts)")
            failures.append(f"{TITAN_MODEL}:dim{dim}")
    except Exception as e:  # noqa: BLE001
        print(f"  [XX ] {TITAN_MODEL} -> {type(e).__name__}: {str(e)[:200]}")
        failures.append(TITAN_MODEL)

    if failures:
        print(f"\nFAIL ({region}): not invocable -> {failures}")
        print("Fix: Bedrock console -> Model access (request access), and confirm the")
        print("     inference-profile id is correct. Do NOT deploy until this passes.")
        return 1

    print(f"\nPASS ({region}): all required Bedrock models invocable. Safe to deploy.")
    return 0


def main():
    parser = argparse.ArgumentParser(description="Verify required Bedrock models are invocable.")
    parser.add_argument("--region", default=os.environ.get("AWS_REGION_NAME", os.environ.get("AWS_DEFAULT_REGION", "us-east-1")))
    args = parser.parse_args()
    sys.exit(check(args.region))


if __name__ == "__main__":
    main()
