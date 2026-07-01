import argparse
import os
import shutil
import sys

from anthropic_client import call_anthropic

EXEMPLARS = {
    "webpage": "docs/generated/todo-webpage-design.md",
    "api": "docs/generated/api-design.md",
}

SYSTEM_PROMPT = """You are a technical design-doc author. Given a plain-English requirement \
brief from a non-technical stakeholder, write a technical design document in Markdown.

Match the structure of this exemplar design doc (same section headings and level of detail, \
not its content):

{exemplar}

Output ONLY the design document itself. Do not wrap it in a markdown code fence. Do not \
include any commentary before or after it."""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--req-file", required=True)
    parser.add_argument("--req-type", required=True, choices=["webpage", "api", "none", "unknown"])
    args = parser.parse_args()

    os.makedirs("docs/generated", exist_ok=True)
    out_path = "docs/generated/DESIGN.md"

    if args.req_type == "none":
        if not os.path.exists(out_path):
            with open(out_path, "w") as f:
                f.write("# No design doc yet — run against a requirement push first.\n")
        print("req_type=none (manual run) — reusing existing DESIGN.md, no API call made.")
        return 0

    if args.req_type == "unknown":
        with open(out_path, "w") as f:
            f.write(
                "# Design Document — unrecognized requirement type\n\n"
                f"Requirement file `{args.req_file}` doesn't match a known template "
                "(`webpage` or `api`). The AI codegen simulation has no template for this — "
                "approving here just lets the pipeline continue against whatever code already "
                "exists; a human author or a real AI call is required to actually implement it.\n"
            )
        print("req_type=unknown — wrote stub design doc, no API call made.")
        return 0

    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        exemplar_path = EXEMPLARS[args.req_type]
        shutil.copyfile(exemplar_path, out_path)
        print(f"⚠️ ANTHROPIC_API_KEY not set — copied {exemplar_path} (simulated fallback).")
        with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
            f.write("⚠️ ANTHROPIC_API_KEY not set — used simulated design-doc fallback\n")
        return 0

    with open(args.req_file) as f:
        brief = f.read()
    with open(EXEMPLARS[args.req_type]) as f:
        exemplar = f.read()

    system = SYSTEM_PROMPT.format(exemplar=exemplar)
    user = f"Write a design document for this brief:\n\n{brief}"

    try:
        design_doc = call_anthropic(api_key, system, user, max_tokens=4096)
    except RuntimeError as e:
        print(f"Anthropic API call failed: {e}", file=sys.stderr)
        return 1

    design_doc = design_doc.strip()
    if design_doc.startswith("```"):
        lines = design_doc.splitlines()
        if lines[-1].strip() == "```":
            design_doc = "\n".join(lines[1:-1])

    with open(out_path, "w") as f:
        f.write(design_doc + "\n")

    print(f"✅ Real Anthropic API call generated {out_path}.")
    with open(os.environ.get("GITHUB_STEP_SUMMARY", os.devnull), "a") as f:
        f.write("✅ Real Anthropic API call generated the design doc\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
