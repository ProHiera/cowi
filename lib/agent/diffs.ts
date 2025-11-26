interface DiffInput {
  filePath?: string | null;
  original?: string | null;
  proposed?: string | null;
}

export function buildUnifiedDiff({ filePath, original, proposed }: DiffInput) {
  if (!filePath || !original || !proposed) {
    return null;
  }

  const originalLines = normalizeLines(original);
  const proposedLines = normalizeLines(proposed);
  const maxLength = Math.max(originalLines.length, proposedLines.length);
  const diffLines: string[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    const before = originalLines[index];
    const after = proposedLines[index];

    if (before === after) {
      diffLines.push(` ${before ?? ""}`);
      continue;
    }

    if (before !== undefined) {
      diffLines.push(`-${before}`);
    }

    if (after !== undefined) {
      diffLines.push(`+${after}`);
    }
  }

  const header = [`--- ${filePath}`, `+++ ${filePath}`, "@@", ...diffLines];
  return header.join("\n");
}

function normalizeLines(value: string) {
  return value.replace(/\r\n/g, "\n").split("\n");
}
