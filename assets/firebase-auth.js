import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyAHTBKLtyfySxdSNrLQdZNrAd9jx2hyp-A',
  authDomain: 'ukranianbusinessnavigator.firebaseapp.com',
  projectId: 'ukranianbusinessnavigator',
  storageBucket: 'ukranianbusinessnavigator.firebasestorage.app',
  messagingSenderId: '114951838982',
  appId: '1:114951838982:web:28b4b8f59a012b3b649287',
  measurementId: 'G-ZZ392CQ3V8',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
const registrationPreferencesKey = 'businessnavigator-registration-preferences';
const localPublicProfileKey = 'businessnavigator-local-public-profile';

isAnalyticsSupported()
  .then((supported) => {
    if (supported) getAnalytics(app);
  })
  .catch(() => {});

function authMessage(error) {
  const messages = {
    'auth/account-exists-with-different-credential': 'Цей email уже використовується з іншим способом входу.',
    'auth/email-already-in-use': 'Акаунт із цим email уже існує. Спробуйте увійти.',
    'auth/invalid-credential': 'Неправильний email або пароль.',
    'auth/invalid-email': 'Перевірте правильність email.',
    'auth/operation-not-allowed': 'Цей спосіб входу ще не увімкнено у Firebase. Скористайтеся входом через Google.',
    'auth/popup-blocked': 'Браузер заблокував вікно входу. Дозвольте спливаючі вікна й спробуйте ще раз.',
    'auth/popup-closed-by-user': 'Вхід скасовано. Відкрийте Google-вхід ще раз.',
    'auth/too-many-requests': 'Забагато спроб. Зачекайте кілька хвилин і повторіть.',
    'auth/unauthorized-domain': 'Цей домен ще не дозволений у Firebase Authentication.',
    'auth/weak-password': 'Пароль має містити щонайменше 8 символів.',
  };

  return messages[error?.code] || 'Не вдалося виконати вхід. Спробуйте ще раз.';
}

function setNote(form, message, state = '') {
  const note = form?.querySelector('[data-form-note]');
  if (!note) return;
  note.textContent = message;
  note.dataset.state = state;
}

function registrationSettings(form) {
  const locationControl = form?.elements.namedItem('locationCode');
  const roleControl = form?.elements.namedItem('profileType');
  const selectedLocation = locationControl?.selectedOptions?.[0];
  const selectedRole = roleControl?.selectedOptions?.[0];

  return {
    profileType: roleControl?.value || 'specialist',
    profileTypeLabel: selectedRole?.textContent?.trim() || 'Користувач / спеціаліст',
    locationCode: locationControl?.value || '',
    locationLabel: selectedLocation?.textContent?.trim() || '',
    publications: {
      avatar: Boolean(form?.elements.namedItem('publishAvatar')?.checked),
      profile: Boolean(form?.elements.namedItem('publishProfile')?.checked),
      map: Boolean(form?.elements.namedItem('publishMap')?.checked),
    },
  };
}

function validateRegistrationSettings(form) {
  if (form?.dataset.authForm !== 'register') return true;
  const settings = registrationSettings(form);
  const hasPublicationChoice = Object.values(settings.publications).some(Boolean);

  if (!settings.locationCode) {
    setNote(form, 'Оберіть основну локацію.', 'error');
    form.elements.namedItem('locationCode')?.focus();
    return false;
  }

  if (!hasPublicationChoice) {
    setNote(form, 'Оберіть щонайменше один дозвіл на публікацію.', 'error');
    const status = form.querySelector('[data-consent-status]');
    if (status) {
      status.textContent = 'Потрібно обрати щонайменше один пункт.';
      status.dataset.state = 'error';
    }
    form.elements.namedItem('publishAvatar')?.focus();
    return false;
  }

  return true;
}

function saveRegistrationSettings(form, user) {
  const settings = registrationSettings(form);
  const displayName = user?.displayName || form?.elements.namedItem('displayName')?.value.trim() || user?.email || 'Користувач';
  const record = {
    ...settings,
    uid: user?.uid || '',
    displayName,
    email: settings.publications.profile ? (user?.email || '') : '',
    photoURL: settings.publications.avatar ? (user?.photoURL || '') : '',
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem('businessnavigator-profile-type', settings.profileType);
  localStorage.setItem(registrationPreferencesKey, JSON.stringify(settings));
  localStorage.setItem(localPublicProfileKey, JSON.stringify(record));
}

document.querySelectorAll('[data-consent-group]').forEach((group) => {
  const allControl = group.querySelector('[data-consent-all]');
  const controls = Array.from(group.querySelectorAll('input[name^="publish"]'));
  const status = group.querySelector('[data-consent-status]');

  function syncConsentState() {
    const selectedCount = controls.filter((control) => control.checked).length;
    allControl.checked = selectedCount === controls.length;
    allControl.indeterminate = selectedCount > 0 && selectedCount < controls.length;
    if (status) {
      status.textContent = selectedCount ? `Обрано дозволів: ${selectedCount} з ${controls.length}.` : 'Оберіть принаймні один дозвіл.';
      status.dataset.state = selectedCount ? 'success' : '';
    }
  }

  allControl.addEventListener('change', () => {
    controls.forEach((control) => { control.checked = allControl.checked; });
    syncConsentState();
  });
  controls.forEach((control) => control.addEventListener('change', syncConsentState));
  syncConsentState();
});

function setBusy(control, busy, busyLabel = 'ЗАЧЕКАЙТЕ…') {
  if (!control) return;
  if (!control.dataset.idleHtml) control.dataset.idleHtml = control.innerHTML;
  control.disabled = busy;
  control.classList.toggle('is-loading', busy);
  if (busy) control.textContent = busyLabel;
  else control.innerHTML = control.dataset.idleHtml;
}

function finishAuth(form, user) {
  const name = user.displayName || user.email || 'користувачу';
  setNote(form, `Вітаємо, ${name}! Вхід виконано.`, 'success');
  window.setTimeout(() => window.location.assign('index.html'), 650);
}

document.querySelectorAll('[data-auth-provider="google"]').forEach((button) => {
  button.addEventListener('click', async () => {
    const form = button.closest('[data-auth-form]');
    if (!validateRegistrationSettings(form)) return;
    setBusy(button, true, 'ВІДКРИВАЄМО GOOGLE…');
    setNote(form, 'Відкриваємо захищений вхід Google…');

    try {
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);
      if (form?.dataset.authForm === 'register') saveRegistrationSettings(form, result.user);
      finishAuth(form, result.user);
    } catch (error) {
      setNote(form, authMessage(error), 'error');
    } finally {
      setBusy(button, false);
    }
  });
});

document.querySelectorAll('[data-auth-form]').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const mode = form.dataset.authForm;
    if (!validateRegistrationSettings(form)) return;
    const email = form.elements.email?.value.trim();
    const password = form.elements.password?.value;
    const submit = form.querySelector('[type="submit"]');

    setBusy(submit, true);
    setNote(form, mode === 'register' ? 'Створюємо ваш акаунт…' : 'Перевіряємо дані…');

    try {
      await setPersistence(auth, browserLocalPersistence);
      let credential;

      if (mode === 'register') {
        credential = await createUserWithEmailAndPassword(auth, email, password);
        const displayName = form.elements.displayName?.value.trim();
        if (displayName) await updateProfile(credential.user, { displayName });
        saveRegistrationSettings(form, credential.user);
      } else {
        credential = await signInWithEmailAndPassword(auth, email, password);
      }

      finishAuth(form, credential.user);
    } catch (error) {
      setNote(form, authMessage(error), 'error');
    } finally {
      setBusy(submit, false);
    }
  });
});

function userInitial(user) {
  return (user.displayName || user.email || 'B').trim().charAt(0).toUpperCase();
}

function createUserAvatar(user) {
  if (user.photoURL) {
    const image = document.createElement('img');
    image.src = user.photoURL;
    image.alt = '';
    image.referrerPolicy = 'no-referrer';
    return image;
  }

  const initial = document.createElement('span');
  initial.textContent = userInitial(user);
  return initial;
}

function renderDesktopSession(user) {
  document.querySelectorAll('.nav-actions').forEach((actions) => {
    actions.querySelector('.auth-session')?.remove();
    const originalLinks = actions.querySelectorAll(':scope > .auth-link, :scope > .contact-btn');
    originalLinks.forEach((link) => { link.hidden = Boolean(user); });

    if (!user) return;

    const session = document.createElement('div');
    session.className = 'auth-session';

    const identity = document.createElement('span');
    identity.className = 'auth-user';
    const avatar = document.createElement('span');
    avatar.className = 'auth-avatar';
    avatar.append(createUserAvatar(user));
    const label = document.createElement('span');
    label.className = 'auth-user-copy';
    const name = document.createElement('strong');
    name.textContent = user.displayName || 'Мій акаунт';
    const email = document.createElement('small');
    email.textContent = user.email || '';
    label.append(name, email);
    identity.append(avatar, label);

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'auth-signout';
    logout.dataset.authSignout = '';
    logout.textContent = 'Вийти';
    session.append(identity, logout);
    actions.append(session);
  });
}

function renderMobileSession(user) {
  document.querySelectorAll('.mobile-menu').forEach((menu) => {
    const links = Array.from(menu.querySelectorAll('a'));
    const login = links.find((link) => link.dataset.authMobile === 'login' || /login\.html$/.test(link.getAttribute('href') || ''));
    const register = links.find((link) => link.dataset.authMobile === 'register' || /register\.html$/.test(link.getAttribute('href') || ''));

    if (login && !login.dataset.authMobile) {
      login.dataset.authMobile = 'login';
      login.dataset.originalLabel = login.textContent;
      login.dataset.originalHref = login.getAttribute('href') || 'login.html';
    }
    if (register && !register.dataset.authMobile) {
      register.dataset.authMobile = 'register';
      register.dataset.originalLabel = register.textContent;
      register.dataset.originalHref = register.getAttribute('href') || 'register.html';
    }

    if (user) {
      if (login) {
        login.textContent = register ? (user.displayName || user.email || 'МІЙ АКАУНТ') : 'ВИЙТИ';
        login.href = register ? 'index.html' : '#';
        if (!register) login.dataset.authSignout = '';
      }
      if (register) {
        register.textContent = 'ВИЙТИ';
        register.href = '#';
        register.dataset.authSignout = '';
      }
    } else {
      if (login) {
        login.textContent = login.dataset.originalLabel;
        login.href = login.dataset.originalHref;
        delete login.dataset.authSignout;
      }
      if (register) {
        register.textContent = register.dataset.originalLabel;
        register.href = register.dataset.originalHref;
        delete register.dataset.authSignout;
      }
    }
  });
}

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-auth-signout]');
  if (!control) return;
  event.preventDefault();
  setBusy(control, true);
  try {
    await signOut(auth);
    window.location.assign('index.html');
  } catch (error) {
    setBusy(control, false);
  }
});

onAuthStateChanged(auth, (user) => {
  document.documentElement.dataset.authReady = 'true';
  renderDesktopSession(user);
  renderMobileSession(user);
});
