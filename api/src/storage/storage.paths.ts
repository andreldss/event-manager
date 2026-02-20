import path from "node:path";

export function ensureSafeChildPath(root: string, child: string) {
    const resolved = path.resolve(root, child);
    const resolvedRoot = path.resolve(root);

    if (!resolved.startsWith(resolvedRoot + path.sep) && resolved !== resolvedRoot) {
        throw new Error("Invalid path");
    }

    return resolved;
}

export function eventFolder(eventId: number) {
    return path.join("events", String(eventId));
}