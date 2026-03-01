/**
 * OSC 7 escape sequence parser.
 *
 * Shells (zsh natively, bash via PROMPT_COMMAND) emit OSC 7 to report the
 * current working directory after every command:
 *
 *   ESC ] 7 ; file://hostname/path ST
 *
 * Where ST is either BEL (0x07) or ESC \ (0x1b 0x5c).
 */

const OSC7_RE = /\x1b\]7;file:\/\/[^/]*([^\x07\x1b]*?)(?:\x07|\x1b\\)/g;

/**
 * Extract the last CWD path from a chunk of terminal data that may contain
 * one or more OSC 7 sequences. Returns the decoded path or `null`.
 */
export function parseOsc7Cwd(data: string): string | null {
  let last: string | null = null;
  let m: RegExpExecArray | null;
  OSC7_RE.lastIndex = 0;
  while ((m = OSC7_RE.exec(data)) !== null) {
    try {
      last = decodeURIComponent(m[1]);
    } catch {
      last = m[1];
    }
  }
  return last;
}
