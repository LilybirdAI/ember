type TemplateFile = {
  path?: string;
  language?: string;
  purpose?: string;
  content?: string;
};

type TemplateLike = {
  appName?: string;
  platform?: string;
  framework?: string;
  previewHtml?: string | null;
  files?: TemplateFile[];
};

function isSafePath(path: string) {
  if (!path) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.includes("\\")) return false;
  if (path.length > 180) return false;

  return true;
}

function hasFile(files: TemplateFile[], path: string) {
  return files.some((file) => file.path === path);
}

function getFile(files: TemplateFile[], path: string) {
  return files.find((file) => file.path === path);
}

export function validateGeneratedTemplate(template: TemplateLike) {
  const errors: string[] = [];

  if (!template.appName || typeof template.appName !== "string") {
    errors.push("Missing app name.");
  }

  if (!template.framework || typeof template.framework !== "string") {
    errors.push("Missing framework.");
  }

  if (!Array.isArray(template.files) || template.files.length === 0) {
    errors.push("Template has no files.");
    return errors;
  }

  const files = template.files;
  const paths = files.map((file) => file.path || "");
  const duplicatePaths = paths.filter(
    (path, index) => path && paths.indexOf(path) !== index
  );

  if (duplicatePaths.length > 0) {
    errors.push(`Duplicate file paths: ${Array.from(new Set(duplicatePaths)).join(", ")}`);
  }

  for (const file of files) {
    const path = file.path || "";
    const content = file.content || "";

    if (!isSafePath(path)) {
      errors.push(`Unsafe or invalid file path: ${path || "(empty)"}`);
    }

    if (!content.trim()) {
      errors.push(`Empty file content: ${path}`);
    }

    if (content.includes("```")) {
      errors.push(`File contains markdown code fence: ${path}`);
    }

    if (path.endsWith(".tsx") && !content.includes("export")) {
      errors.push(`TSX file may be missing export: ${path}`);
    }
  }

  if (hasFile(files, "next.config.ts")) {
    errors.push("Use next.config.mjs instead of next.config.ts.");
  }

  const isNextApp =
    hasFile(files, "package.json") ||
    hasFile(files, "app/page.tsx") ||
    hasFile(files, "app/layout.tsx");

  if (isNextApp) {
    const required = [
      "package.json",
      "next.config.mjs",
      "next-env.d.ts",
      "tsconfig.json",
      "app/layout.tsx",
      "app/page.tsx",
      "app/globals.css",
      "README.md",
    ];

    for (const path of required) {
      if (!hasFile(files, path)) {
        errors.push(`Missing required Next.js file: ${path}`);
      }
    }

    const packageFile = getFile(files, "package.json");

    if (packageFile?.content) {
      try {
        const parsed = JSON.parse(packageFile.content);

        if (!parsed.scripts?.dev) {
          errors.push("package.json missing scripts.dev.");
        }

        if (!parsed.dependencies?.next) {
          errors.push("package.json missing next dependency.");
        }

        if (!parsed.dependencies?.react) {
          errors.push("package.json missing react dependency.");
        }

        if (!parsed.dependencies?.["react-dom"]) {
          errors.push("package.json missing react-dom dependency.");
        }
      } catch {
        errors.push("package.json is invalid JSON.");
      }
    }

    const layoutFile = getFile(files, "app/layout.tsx");

    if (layoutFile?.content && !layoutFile.content.includes("./globals.css")) {
      errors.push("app/layout.tsx must import ./globals.css.");
    }

    const pageFile = getFile(files, "app/page.tsx");

    if (pageFile?.content && !pageFile.content.includes("export default function")) {
      errors.push("app/page.tsx must include export default function.");
    }
  }

  return errors;
}
