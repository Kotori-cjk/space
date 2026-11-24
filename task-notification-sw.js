self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type:'window', includeUncontrolled:true });
    const page = windows.find(client => client.url.startsWith(self.registration.scope));
    if (page) await page.focus();
    else await self.clients.openWindow(self.registration.scope);
  })());
});
