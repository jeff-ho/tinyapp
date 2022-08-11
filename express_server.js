const express = require("express");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const cookieSession = require("cookie-session");
const { findUser, generateRandomString, urlsForUser } = require("./helpers");

////////////////////////////////////////////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////////////////////////////////////////////

const app = express();
const PORT = 8080;
app.set("view engine", "ejs");

////////////////////////////////////////////////////////////////////////////////////////////////////
// Middleware
////////////////////////////////////////////////////////////////////////////////////////////////////

app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  cookieSession({
    name: "session",
    keys: ["hello"],

    // Cookie Options
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

////////////////////////////////////////////////////////////////////////////////////////////////////
// Databases
////////////////////////////////////////////////////////////////////////////////////////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////////////////////////////////////////////

// Renders list of user URLS based on user
app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlsForUser(req.session.user_id, urlDatabase),
    user: users[req.session.user_id],
  };
  const user = users[req.session.user_id];
  if (!user) {
    return res.send("NO PERMISSION PLEASE LOG IN OR REGISTER FIRST");
  } else {
    res.render("urls_index", templateVars);
  }
});

//Renders form for new url submission
app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  const user = users[req.session.user_id];
  if (!user) {
    return res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

//Renders the url editing page with user protection
app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  const id = req.params.id;
  const url = urlDatabase[id];
  if (!user) {
    return res.send("ERROR! PLEASE LOG IN!");
  }

  if (!url) {
    return res.send("ID DOES NOT EXIST");
  }

  if (user.id !== url.userID) {
    return res.send("NO PERMISSION");
  }

  const templateVars = {
    user: users[req.session.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
  };
  return res.render("urls_show", templateVars);
});

//Generates a new code for long URL with redirect to urls/:id
app.post("/urls", (req, res) => {
  let code = generateRandomString();
  const user = users[req.session.user_id];
  urlDatabase[code] = {
    longURL: req.body.longURL,
    userID: req.session.user_id,
  };

  if (!user) {
    return res.send("You cannot shorten URLS because you are not logged in!");
  } else {
    res.redirect(`/urls/${code}`);
  }
});

//Redirects to the actual long URL website
app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  if (!urlDatabase[id]) {
    return res.send("THIS ID DOES NOT EXIST");
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

// Deletes specific urls with user protection with redirect back to url list
app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];

  if (!user) {
    console.log("YOU ARE NOT LOGGED IN");
    return res.send("YOU ARE NOT LOGGED IN");
  }

  if (!url) {
    console.log("ID DOES NOT EXIST");
    return res.send("ID DOES NOT EXIST");
  }

  if (user.id !== url.userID) {
    console.log("NO PERMISSION");
    return res.send("NO PERMISSION");
  }

  delete urlDatabase[id];
  res.redirect(`/urls`);
});

//Editing specific URL with user protection and redirect to urls new if safe
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const url = urlDatabase[id];
  if (!user) {
    console.log("Error Please Log In");
    return res.send("Error Log In Please");
  }

  if (!url) {
    return res.send("ID DOES NOT EXIST");
  }

  if (user.id !== url.userID) {
    return res.send("NO PERMISSION");
  }

  res.redirect(`/urls/${id}`);
});

//Edits the old URL into the new one
app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.newURL;
  urlDatabase[id].longURL = newURL;
  res.redirect(`/urls`);
});

//Login comparing hashed passwords
app.post("/login", (req, res) => {
  const e_mail = req.body.email;
  const givenPassword = req.body.password;

  if (findUser(e_mail, users) === null) {
    res.status(404).send("Please Register");
    return;
  }
  const hashedPassword = findUser(e_mail, users).password;
  const comparePassword = bcrypt.compareSync(givenPassword, hashedPassword);
  const id = findUser(e_mail, users).id;

  if (findUser(e_mail, users) && !comparePassword) {
    res.send("Wrong Password");
    return;
  }

  if (findUser(e_mail, users) && comparePassword) {
    //res.cookie("user_id", id);
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

//Login page render
app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  const user = users[req.session.user_id];

  if (user) {
    return res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

// Logout clearing cookie + redirect to login page
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

//Renders register page with redirect to urls if logged in
app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.session.user_id],
  };
  const user = users[req.session.user_id];
  if (user) {
    return res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

// Register logic with error routing. If successful routes to urls and adds to user database.
app.post("/register", (req, res) => {
  const randomID = generateRandomString();
  const e_mail = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);

  if (!e_mail || !password) {
    res.status(400).send("Please Enter A Valid Email/Password!");
    return;
  }
  if (findUser(e_mail, users)) {
    res.status(400).send("Email Already Exists!");
    return;
  }
  users[randomID] = { id: randomID, email: e_mail, password: hashedPassword };
  req.session.user_id = randomID;
  return res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
