These are hand-authored stand-ins for what a real AI codegen call would produce, selected by the
pipeline's `codegen` job based on which `requirements/*.txt` file changed (`webpage` or `api`).
Swapping in real generation means replacing that job's `cp -r templates/<type>/...` step with an
Anthropic API call that writes the requirement brief + approved design doc into these same paths.
