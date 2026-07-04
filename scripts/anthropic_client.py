import json
import urllib.error
import urllib.request

API_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-5"
ANTHROPIC_VERSION = "2023-06-01"


def call_anthropic(api_key: str, system: str, user: str, max_tokens: int) -> str:
    body = {
        "model": MODEL,
        "max_tokens": max_tokens,
        "system": system,
        "messages": [{"role": "user", "content": user}],
    }
    req = urllib.request.Request(
        API_URL,
        data=json.dumps(body).encode("utf-8"),
        headers={
            "x-api-key": api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Anthropic API HTTP {e.code}: {e.read().decode('utf-8', 'replace')}")

    try:
        for block in data["content"]:
            if block.get("type") == "text":
                return block["text"]
        raise KeyError("no text-type content block")
    except (KeyError, IndexError):
        raise RuntimeError(f"Unexpected Anthropic API response shape: {data!r}")
