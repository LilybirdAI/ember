import { mkdtemp, rm, writeFile, mkdir, access } from "fs/promises";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

type BuildFile = {
  path: string;
  content: string;
};

function isSafePath(filePath: string) {
  if (!filePath) return false;
  if (filePath.startsWith("/")) return false;
  if (filePath.includes("..")) return false;
  if (filePath.includes("\\")) return false;
  return true;
}

function getMinimalEnv(mode: "install" | "build") {
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH || "",
    HOME: process.env.HOME || "",
    USER: process.env.USER || "",
    TMPDIR: process.env.TMPDIR || os.tmpdir(),
    npm_config_loglevel: "error",
    NODE_ENV: mode === "build" ? "production" : "development",
    NEXT_TELEMETRY_DISABLED: "1",
  };

  return env;
}

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  mode: "install" | "build"
) {
  try {
    const result = await execFileAsync(command, args, {
      cwd,
      timeout: 180_000,
      maxBuffer: 1024 * 1024 * 12,
      env: getMinimalEnv(mode),
    });

    return {
      ok: true,
      stdout: result.stdout,
      stderr: result.stderr,
      output: `${result.stdout}\n${result.stderr}`.trim(),
    };
  } catch (error: any) {
    return {
      ok: false,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      output: `${error.stdout || ""}\n${error.stderr || ""}\n${error.message || ""}`.trim(),
    };
  }
}

async function findNextBinary(cwd: string) {
  const unixPath = path.join(cwd, "node_modules", ".bin", "next");
  const windowsPath = path.join(cwd, "node_modules", ".bin", "next.cmd");

  try {
    await access(unixPath);
    return unixPath;
  } catch {
    return windowsPath;
  }
}

export async function runGeneratedAppBuildCheck(files: BuildFile[]) {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "embr-build-"));

  try {
    for (const file of files) {
      if (!isSafePath(file.path)) {
        return {
          success: false,
          stage: "write_files",
          output: `Unsafe file path: ${file.path}`,
        };
      }

      const fullPath = path.join(tempDir, file.path);
      await mkdir(path.dirname(fullPath), { recursive: true });
      await writeFile(fullPath, file.content, "utf8");
    }

    const packageJson = files.find((file) => file.path === "package.json");

    if (!packageJson) {
      return {
        success: false,
        stage: "preflight",
        output: "Missing package.json. Cannot run npm build.",
      };
    }

    const installResult = await runCommand(
      "npm",
      ["install", "--silent"],
      tempDir,
      "install"
    );

    if (!installResult.ok) {
      return {
        success: false,
        stage: "install",
        output: installResult.output,
      };
    }

    const nextBinary = await findNextBinary(tempDir);

    const buildResult = await runCommand(
      nextBinary,
      ["build"],
      tempDir,
      "build"
    );

    if (!buildResult.ok) {
      return {
        success: false,
        stage: "build",
        output: buildResult.output,
      };
    }

    return {
      success: true,
      stage: "build",
      output: buildResult.output || "Build passed.",
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
