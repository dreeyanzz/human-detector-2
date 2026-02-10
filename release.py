"""
Create a GitHub Release with the built PersonDetector.zip.

Usage:
    python release.py v1.0.0
    python release.py v1.0.0 --notes "Fixed camera bug"
"""

import argparse
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ZIP_PATH = ROOT / "dist" / "PersonDetector.zip"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build and release PersonDetector")
    parser.add_argument("version", help="Release tag, e.g. v1.0.0")
    parser.add_argument("--notes", default="", help="Release notes (optional)")
    args = parser.parse_args()

    # 1. Build
    print("\n  Building...\n")
    try:
        subprocess.check_call([sys.executable, "build.py"], cwd=str(ROOT))
    except subprocess.CalledProcessError:
        print("\n  Error: Build failed. Fix the errors above and try again.\n")
        sys.exit(1)

    if not ZIP_PATH.exists():
        print(f"\n  Error: {ZIP_PATH} not found after build.\n")
        sys.exit(1)

    # 2. Release
    print(f"\n  Creating release {args.version}...\n")
    cmd = [
        "gh", "release", "create", args.version,
        str(ZIP_PATH),
        "--title", args.version,
        "--notes", args.notes or f"Release {args.version}",
    ]
    try:
        subprocess.check_call(cmd, cwd=str(ROOT))
    except subprocess.CalledProcessError:
        print("\n  Error: Release failed. Make sure 'gh' is installed and you're authenticated (gh auth login).\n")
        sys.exit(1)

    print(f"\n  Done! Released {args.version}\n")


if __name__ == "__main__":
    main()
