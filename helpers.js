//Find users by email from any database
function findUser(email, database) {
  let result;
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    } else {
      result = null;
    }
  }
  return result;
}

// Generates a random string for user id during registration
function generateRandomString() {
  let result = "";
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let length = chars.length;
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * length));
  }
  return result;
}


// Displays the relevant URLS for each specific user
function urlsForUser(id, database) {
  let result = {};
  for (const url in database) {
    let userID = database[url].userID;
    let longURL = database[url].longURL;
    if (id === userID) {
      result[url] = { longURL: longURL, userID: userID };
    }
  }
  return result;
}

module.exports = {findUser, generateRandomString, urlsForUser}