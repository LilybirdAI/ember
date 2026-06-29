export type EmbrClientRole = "admin" | "client";

export type EmbrClientApp = {
  appId: string;
  name: string;
  description: string;
  path: string;
  status: "live" | "coming-soon";
};

export type EmbrClientAccount = {
  username: string;
  displayName: string;
  role: EmbrClientRole;
  apps: string[];
  landingPath: string;
  passwordEnv: string;
  tokenEnv: string;
};

export const embrClientApps: EmbrClientApp[] = [
  {
    appId: "mindshot-golf",
    name: "MindShot Golf",
    description: "Golf app health, Embr activity, usage, and intelligence.",
    path: "/control-center/mindshot-golf",
    status: "live",
  },
  {
    appId: "sober-house-command-center",
    name: "Sober House Command Center",
    description: "Recovery housing operations, daily check-ins, and command center intelligence.",
    path: "/control-center/sober-house-command-center",
    status: "coming-soon",
  },
  {
    appId: "bagfree",
    name: "BagFree",
    description: "Travel app intelligence, support automation, and user insight layer.",
    path: "/control-center/bagfree",
    status: "coming-soon",
  },
  {
    appId: "fuel-the-flame",
    name: "Fuel the Flame",
    description: "App intelligence and owner command center.",
    path: "/control-center/fuel-the-flame",
    status: "coming-soon",
  },
];

export const embrClientAccounts: EmbrClientAccount[] = [
  {
    username: "matt",
    displayName: "Matt / Embr Admin",
    role: "admin",
    apps: ["*"],
    landingPath: "/operator",
    passwordEnv: "EMBR_LOGIN_MATT_PASSWORD",
    tokenEnv: "EMBR_LOGIN_MATT_TOKEN",
  },
  {
    username: "george",
    displayName: "George / MindShot",
    role: "client",
    apps: ["mindshot-golf"],
    landingPath: "/control-center/mindshot-golf",
    passwordEnv: "EMBR_LOGIN_GEORGE_PASSWORD",
    tokenEnv: "EMBR_LOGIN_GEORGE_TOKEN",
  },
  {
    username: "soberhouse",
    displayName: "Sober House Client",
    role: "client",
    apps: ["sober-house-command-center"],
    landingPath: "/client",
    passwordEnv: "EMBR_LOGIN_SOBERHOUSE_PASSWORD",
    tokenEnv: "EMBR_LOGIN_SOBERHOUSE_TOKEN",
  },
  {
    username: "bagfree",
    displayName: "BagFree Client",
    role: "client",
    apps: ["bagfree"],
    landingPath: "/client",
    passwordEnv: "EMBR_LOGIN_BAGFREE_PASSWORD",
    tokenEnv: "EMBR_LOGIN_BAGFREE_TOKEN",
  },
  {
    username: "fuel",
    displayName: "Fuel the Flame Client",
    role: "client",
    apps: ["fuel-the-flame"],
    landingPath: "/client",
    passwordEnv: "EMBR_LOGIN_FUEL_PASSWORD",
    tokenEnv: "EMBR_LOGIN_FUEL_TOKEN",
  },
];

export function getAccountPassword(account: EmbrClientAccount) {
  return process.env[account.passwordEnv] || "";
}

export function getAccountToken(account: EmbrClientAccount) {
  return process.env[account.tokenEnv] || "";
}

export function getAccountByUsername(username: string) {
  const normalized = username.trim().toLowerCase();
  return embrClientAccounts.find((account) => account.username === normalized) || null;
}

export function getAccountByToken(token?: string) {
  if (!token) return null;

  return (
    embrClientAccounts.find((account) => {
      const accountToken = getAccountToken(account);
      return Boolean(accountToken && token === accountToken);
    }) || null
  );
}

export function accountCanAccessApp(account: EmbrClientAccount, appId: string) {
  return account.role === "admin" || account.apps.includes("*") || account.apps.includes(appId);
}

export function getVisibleApps(account: EmbrClientAccount) {
  if (account.role === "admin" || account.apps.includes("*")) {
    return embrClientApps;
  }

  return embrClientApps.filter((app) => account.apps.includes(app.appId));
}

export function getPublicAccount(account: EmbrClientAccount) {
  return {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
    landingPath: account.landingPath,
    apps: getVisibleApps(account),
  };
}
