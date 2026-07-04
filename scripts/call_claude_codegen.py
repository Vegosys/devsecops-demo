import argparse
import os
import shutil
import sys

from anthropic_client import call_anthropic

ALLOWED_ROOTS = {"webpage": "site/", "api": "src/DemoApi/"}

SYSTEM_PROMPT = """You are a code generator. Given a plain-English requirement brief and its \
approved technical design document, write the complete contents of the source file(s) that \
implement it.

Requirement type: {req_type}
{file_list}

Keep output compact: if decorative images are requested, use CSS (gradients, shapes, emoji)
or small inline SVG (under ~30 lines) instead of embedded base64 image data or long asset
descriptions — output must fit well within the token budget.

Output ONLY the following format, with no commentary before, between, or after:

===FILE: <relative-path>===
<complete file contents>

===FILE: <relative-path>===
<complete file contents>

===END===

Do not wrap file contents in markdown code fences. The `===END===` line is mandatory."""

FILE_LISTS = {
    "webpage": "Write exactly these 3 files: site/index.html, site/styles.css, site/app.js",
    "api": "Write exactly this 1 file: src/DemoApi/Program.cs",
}


def parse_files(text: str) -> dict:
    if "===END===" not in text:
        raise ValueError("Response missing mandatory ===END=== terminator")
    body = text.split("===END===")[0]

    files = {}
    parts = body.split("===FILE:")
    for part in parts[1:]:
        header, _, content = part.partition("===")
        path = header.strip()
        content = content.strip("\n")
        if content.startswith("```"):
            lines = content.splitlines()
            if len(lines) >= 2 and lines[-1].strip().startswith("```"):
                content = "\n".join(lines[1:-1])
        if not path or not content.strip():
            raise ValueError(f"Empty path or content for entry: {header!r}")
        files[path] = content + "\n"
    if not files:
        raise ValueError("No ===FILE: ... === entries found in response")
    return files


def validate_path(path: str, req_type: str) -> str:
    root = ALLOWED_ROOTS[req_type]
    if not path or path.startswith("/") or path.startswith("~"):
        raise ValueError(f"Rejected absolute/home-relative path: {path!r}")
    if ".." in path.split("/"):
        raise ValueError(f"Rejected path traversal: {path!r}")
    if not path.startswith(root):
        raise ValueError(f"Path {path!r} escapes allowed root {root!r} for req_type={req_type!r}")
    if req_type == "api" and path != "src/DemoApi/Program.cs":
        raise ValueError(f"Unexpected path for api type: {path!r}")
    return path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--req-file", required=True)
    parser.add_argument("--design-doc", required=True)
    parser.add_argument("--req-type", required=True, choices=["webpage", "api"])
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        if args.req_type == "webpage":
            shutil.copytree("templates/webpage/site", "site", dirs_exist_ok=True)
        else:
            shutil.copytree("templates/api/src/DemoApi", "src/DemoApi", dirs_exist_ok=True)
        print(f"⚠️ ANTHROPIC_API_KEY not set — copied templates/{args.req_type} (simulated fallback).")
        with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
            f.write("⚠️ ANTHROPIC_API_KEY not set — used simulated codegen fallback\n")
        return 0

    with open(args.req_file) as f:
        brief = f.read()
    with open(args.design_doc) as f:
        design_doc = f.read()

    system = SYSTEM_PROMPT.format(req_type=args.req_type, file_list=FILE_LISTS[args.req_type])
    user = f"## Brief\n{brief}\n\n## Approved Design\n{design_doc}"

    try:
        response = call_anthropic(api_key, system, user, max_tokens=16000)
        files = parse_files(response)
        for path in files:
            validate_path(path, args.req_type)
    except (RuntimeError, ValueError) as e:
        print(f"Codegen failed: {e}", file=sys.stderr)
        return 1

    for path, content in files.items():
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)

    print(f"✅ Real Anthropic API call generated {len(files)} file(s): {', '.join(files)}")
    with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
        f.write(f"✅ Real Anthropic API call generated {len(files)} file(s)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
