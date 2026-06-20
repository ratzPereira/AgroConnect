"""
Add `readonly` to each prop field in component Props interfaces/types
to satisfy Sonar S6759.

Scans .tsx files for `interface XxxProps {...}` or `type XxxProps = {...}`
blocks and prefixes each property line with `readonly` if not already.
"""
import re
import sys
from pathlib import Path

ROOT = Path("C:/AgroConnect/frontend/src")

# Match start of a Props interface or type
INTERFACE_RE = re.compile(
    r"^(?P<indent>\s*)(?:export\s+)?interface\s+(?P<name>\w*Props)\b(?:\s+extends\s+[^{]+)?\s*\{",
    re.MULTILINE,
)
TYPE_RE = re.compile(
    r"^(?P<indent>\s*)(?:export\s+)?type\s+(?P<name>\w*Props)\s*=\s*(?:Readonly<)?\s*\{",
    re.MULTILINE,
)

# A property line: optional `readonly`/modifier, then identifier or quoted key, optional `?`, colon, value
PROP_LINE_RE = re.compile(
    r"^(?P<indent>\s*)(?P<key>(?:'[^']+'|\"[^\"]+\"|\w+|\[[^\]]+\]))(?P<opt>\??)\s*:\s*",
)


def find_block_end(text: str, open_pos: int) -> int:
    """Given index of `{`, return index of matching `}`."""
    depth = 0
    i = open_pos
    in_str = None
    while i < len(text):
        c = text[i]
        if in_str:
            if c == "\\":
                i += 2
                continue
            if c == in_str:
                in_str = None
        else:
            if c in ("'", '"', "`"):
                in_str = c
            elif c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    return i
        i += 1
    return -1


def process_block(lines: list[str], start_line: int, end_line: int) -> int:
    """Add `readonly` to each property line in [start_line+1, end_line). Returns count modified."""
    modified = 0
    i = start_line + 1
    while i < end_line:
        line = lines[i]
        stripped = line.lstrip()
        # Skip blank, comments, method-only, or already readonly
        if (
            not stripped
            or stripped.startswith("//")
            or stripped.startswith("/*")
            or stripped.startswith("*")
            or stripped.startswith("readonly ")
        ):
            i += 1
            continue
        m = PROP_LINE_RE.match(line)
        if m:
            indent = m.group("indent")
            rest = line[len(indent):]
            lines[i] = f"{indent}readonly {rest}"
            modified += 1
        i += 1
    return modified


def process_file(path: Path) -> int:
    text = path.read_text(encoding="utf-8")
    blocks = []
    for m in INTERFACE_RE.finditer(text):
        open_pos = text.index("{", m.end() - 1)
        close_pos = find_block_end(text, open_pos)
        if close_pos > 0:
            blocks.append((open_pos, close_pos))
    for m in TYPE_RE.finditer(text):
        open_pos = text.index("{", m.end() - 1)
        close_pos = find_block_end(text, open_pos)
        if close_pos > 0:
            blocks.append((open_pos, close_pos))
    if not blocks:
        return 0

    lines = text.split("\n")
    # Convert (open_pos, close_pos) → line numbers
    total = 0
    line_offsets = [0]
    for line in lines:
        line_offsets.append(line_offsets[-1] + len(line) + 1)

    def pos_to_line(pos: int) -> int:
        lo, hi = 0, len(line_offsets) - 1
        while lo < hi:
            mid = (lo + hi) // 2
            if line_offsets[mid] <= pos < line_offsets[mid + 1]:
                return mid
            if line_offsets[mid] > pos:
                hi = mid - 1
            else:
                lo = mid + 1
        return lo

    for open_pos, close_pos in blocks:
        sl = pos_to_line(open_pos)
        el = pos_to_line(close_pos)
        total += process_block(lines, sl, el)

    if total:
        path.write_text("\n".join(lines), encoding="utf-8")
    return total


def main():
    files = list(ROOT.rglob("*.tsx"))
    total_files = 0
    total_changes = 0
    for f in files:
        # Skip test files
        if ".test." in f.name or ".spec." in f.name or "__tests__" in str(f):
            continue
        try:
            changed = process_file(f)
            if changed:
                total_files += 1
                total_changes += changed
                print(f"  {f.relative_to(ROOT)}: {changed} props")
        except Exception as e:
            print(f"ERROR {f}: {e}", file=sys.stderr)
    print(f"\nTotal: {total_changes} props in {total_files} files")


if __name__ == "__main__":
    main()
