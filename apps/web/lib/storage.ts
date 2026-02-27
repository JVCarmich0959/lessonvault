export function setToken(token: string) {
  localStorage.setItem("lv_token", token);
}
export function getToken() {
  return localStorage.getItem("lv_token");
}
