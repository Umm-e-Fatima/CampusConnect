const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(
    /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
  )
);

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost) {
        // On localhost — check if SW still exists
        checkValidServiceWorker(swUrl);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'CampusConnect is being served cache-first by a service worker. ' +
            'To learn more, visit https://cra.link/PWA'
          );
        });
      } else {
        // On production-just register
        registerValidSW(swUrl);
      }
    });
  }
}

function registerValidSW(swUrl) {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available-notify user
              console.log('CampusConnect: new version available. Refresh to update.');
            } else {
              console.log('CampusConnect: content cached for offline use.');
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('CampusConnect SW registration failed:', error);
    });
}

function checkValidServiceWorker(swUrl) {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // SW not found-reload page
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl);
      }
    })
    .catch(() => {
      console.log('CampusConnect: no internet connection. App running in offline mode.');
    });
}

export const subscribeToPush = async (token) => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.log('Push not supported');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Push permission denied');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.REACT_APP_VAPID_PUBLIC_KEY
      ),
    });

    // Save subscription to backend
    await fetch(`${process.env.REACT_APP_API_URL}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ subscription }),
    });

    console.log('Push subscription saved');
  } catch (err) {
    console.error('Push subscription failed:', err);
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output  = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}