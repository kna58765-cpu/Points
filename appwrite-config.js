/* POINTS Appwrite client configuration.
 * Public client settings only. Never place an Appwrite API key here.
 */
(function () {
  const client = new Appwrite.Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6aff042d000ca36303b3');
  const account = new Appwrite.Account(client);
  const callbackBase = 'https://kna58765-cpu.github.io/Points/account-action.html';
  window.pointsCloud = {
    client,
    account,
    async currentUser() { return account.get(); },
    async register(email, password, name) {
      await account.create({ userId: Appwrite.ID.unique(), email, password, name });
      await account.createEmailPasswordSession({ email, password });
      await account.createVerification({ url: callbackBase + '?action=verify' });
      return account.get();
    },
    async login(email, password) {
      await account.createEmailPasswordSession({ email, password });
      return account.get();
    },
    async resendVerification() {
      return account.createVerification({ url: callbackBase + '?action=verify' });
    },
    async requestPasswordReset(email) {
      return account.createRecovery({ email, url: callbackBase + '?action=recovery' });
    },
    async confirmVerification(userId, secret, email, password) {
      await account.createEmailPasswordSession({ email, password });
      return account.updateVerification({ userId, secret });
    },
    async completePasswordReset(userId, secret, password) {
      return account.updateRecovery({ userId, secret, password, passwordAgain: password });
    },
    async logout() { return account.deleteSession({ sessionId: 'current' }); }
  };
})();