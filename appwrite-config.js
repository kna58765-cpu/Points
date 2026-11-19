/* POINTS Appwrite client configuration.
 * Public client settings only. Never place an Appwrite API key here.
 */
(function () {
  const client = new Appwrite.Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6aff042d000ca36303b3');
  const account = new Appwrite.Account(client);
  window.pointsCloud = {
    client,
    account,
    async currentUser() { return account.get(); },
    async register(email, password, name) {
      await account.create({ userId: Appwrite.ID.unique(), email, password, name });
      return account.createEmailPasswordSession({ email, password });
    },
    async login(email, password) {
      return account.createEmailPasswordSession({ email, password });
    },
    async logout() { return account.deleteSession({ sessionId: 'current' }); }
  };
})();