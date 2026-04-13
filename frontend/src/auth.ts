import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "my-app",
  clientId: "my-app-client",
});

export async function initAuth(): Promise<boolean> {
  return keycloak.init({
    onLoad: "check-sso",
    silentCheckSsoRedirectUri:
      window.location.origin + "/silent-check-sso.html",
    checkLoginIframe: true,
  });
}

export function login() {
  keycloak.login();
}

export function logout() {
  keycloak.logout({ redirectUri: window.location.origin });
}

export function isAuthenticated(): boolean {
  return !!keycloak.authenticated;
}

export async function getValidToken(): Promise<string | undefined> {
  if (!keycloak.authenticated) {
    return undefined;
  }
  try {
    await keycloak.updateToken(30);
    return keycloak.token;
  } catch {
    return undefined;
  }
}
