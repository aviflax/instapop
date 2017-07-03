const instapaper = require("instapaper");
const mailgun = require("mailgun-js");

const create_instapaper_client = (key, secret, username, password) => {
  const client = instapaper(key, secret);
  client.setUserCredentials(username, password);
  return client;
};

const create_mailgun_client = (api_key, domain) => {
  return mailgun({ apiKey: api_key, domain: domain });
};

const random_element = array => {
  return array[Math.floor(Math.random() * array.length)];
};

// returns a promise that in the success case “returns” the bookmark, for chaining, and in the error
// case “returns” an error object of some kind.
const email_bookmark = (bookmark, mailgun_client, mailgun_domain, to_address) => {
  const from_header = "Instapop <instapop@" + mailgun_domain + ">";

  const email = {
    from: from_header,
    to: to_address,
    subject: "Your daily pop:",
    text: "Testing some Mailgun awesomness!"
  };

  return mailgun.messages().send(email).then(_body => bookmark).catch(err => err);
};

// returns a promise
const archive_bookmark = (bookmark, instapaper_client) => {
  return instapaper_client.bookmarks.archive(bookmark.GET_ID_TODO);
};

module.exports = function(context, cb) {
  const secrets = context.secrets; // just for readability

  const instapaper_client = create_instapaper_client(
    secrets.instapaper_consumer_key,
    secrets.instapaper_consumer_secret,
    secrets.instapaper_username,
    secrets.instapaper_password
  );

  const mailgun_client = create_mailgun_client(secrets.mailgun_api_key, secrets.mailgun_domain);

  instapaper_client.bookmarks
    .list()
    .then(random_element)
    .then(bookmark =>
      email_bookmark(bookmark, mailgun_client, secrets.mailgun_domain, secrets.to_address))
    .then(bookmark => archive_bookmark(bookmark, instapaper_client))
    .then(() => cb(null, null))
    .catch(err => cb(err, null));
};
