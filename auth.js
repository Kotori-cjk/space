const SPACE_AUTH_KEY = 'kotori-space-auth';
const SPACE_PASSWORD = 'Favorite';
// Update this return link when Homepage moves to its future .com domain.
const HOMEPAGE_URL = 'https://kotori-cjk.github.io/';
const authRedirect = document.currentScript?.dataset.authRedirect || '';

function hasSpaceAccess() {
  return sessionStorage.getItem(SPACE_AUTH_KEY) === 'ok' || localStorage.getItem(SPACE_AUTH_KEY) === 'ok';
}

if (!hasSpaceAccess() && authRedirect) window.location.replace(authRedirect);
if (!hasSpaceAccess() && !authRedirect) document.documentElement.classList.add('space-locked');

document.addEventListener('DOMContentLoaded', () => {
  if (authRedirect) return;
  const gate = document.getElementById('space-auth-gate');
  const input = document.getElementById('space-auth-password');
  const hint = document.getElementById('space-auth-hint');
  const submit = document.getElementById('space-auth-submit');
  const home = document.getElementById('space-auth-home');

  home.href = HOMEPAGE_URL;
  if (hasSpaceAccess()) return;
  gate.setAttribute('aria-hidden', 'false');

  const unlock = () => {
    if (input.value !== SPACE_PASSWORD) {
      hint.textContent = '密码不正确。';
      input.select();
      return;
    }
    sessionStorage.setItem(SPACE_AUTH_KEY, 'ok');
    localStorage.setItem(SPACE_AUTH_KEY, 'ok');
    document.documentElement.classList.remove('space-locked');
    gate.setAttribute('aria-hidden', 'true');
  };

  submit.addEventListener('click', unlock);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') unlock();
  });
  input.focus();
});
