/**
 * Converts a file path to POSIX format (forward slashes).
 *
 * @param p - Path to convert
 * @returns POSIX-formatted path
 */
export function toPosix(p: string): string {
    return p.replace(/\\/g, '/');
}
