"""The whole test pipeline, in one place: the pre-push hook and GitHub Actions (pipeline.yml) both run this.

    python3 tools/check.py             # every stage, in order; stops at the first stage that fails
    python3 tools/check.py --stage 1   # one stage (GitHub runs each stage as its own job)

Stage 1, no browser: images and routines are valid, and output/ is rebuilt from them.
Stage 2, headless Chrome: the printed sheets keep their pictures sharp, the sheet maker works.
Add a check here, not in the workflow, so the local and the GitHub pipeline stay the same.
"""
import subprocess
import sys
import time

# The rebuilt files may differ only in measured colours: JPEG decoding differs slightly between Pillow builds.
REBUILT = ["git", "diff", "--exit-code", "-I", 'style="--step:', "-I", '^  "[a-z0-9-]+": \\["#', "--",
           "output/", "children/data.js", "images/README.md"]

STAGES = {
    1: [("images and routines", ["python3", "tools/check_images.py"]),
        ("rebuild output", ["python3", "tools/build.py"]),
        ("output is committed as rebuilt", REBUILT)],
    2: [("pictures sharp in print", ["python3", "tools/pdf_test.py"]),
        ("sheet maker in the browser", ["python3", "tools/web_test.py"])],
}


def run_stage(n):
    for name, cmd in STAGES[n]:
        start = time.monotonic()
        print(f"\n=== Stage {n}: {name} ===", flush=True)
        ok = subprocess.run(cmd).returncode == 0
        print(f"--- {name}: {'ok' if ok else 'FAILED'} in {time.monotonic() - start:.1f} s", flush=True)
        if not ok:
            if cmd is REBUILT:
                print("Run python3 tools/build.py and commit output/, children/data.js and images/README.md.")
            return False
    return True


def main():
    args = sys.argv[1:]
    stages = [int(args[1])] if args[:1] == ["--stage"] and len(args) == 2 else list(STAGES)
    for n in stages:
        if not run_stage(n):
            sys.exit(1)
    print(f"\nAll checks passed (stages {', '.join(map(str, stages))}).")


if __name__ == "__main__":
    main()
