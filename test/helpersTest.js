const { assert } = require('chai');

const { findUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('findUser', function() {
  it('should return the object of the valid user', function() {
    const user = findUser("user@example.com", testUsers)
    const expectedUserID = "userRandomID";
    assert.deepEqual(user, testUsers[expectedUserID])
  });

  it('should return null if the user does not exist', function() {
    const user = findUser("user3@example.com", testUsers)
    assert.deepEqual(user, null)
  });

  it('should return null if no user was entered', function() {
    const user = findUser("", testUsers)
    assert.deepEqual(user, null)
  });
});