const express = require("express");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

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

function findUser(email) {
  let result;
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    } else {
      result = null;
    }
  }
  return result;
}

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
app.use(cookieParser());
app.use(morgan("dev"));

////////////////////////////////////////////////////////////////////////////////////////////////////
// Databases
////////////////////////////////////////////////////////////////////////////////////////////////////
// const urlDatabase = {
//   b2xVn2: "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com",
// };

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

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.user_id],
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  const user = users[req.cookies.user_id];
  if (!user) {
    return res.redirect("/login");
  } else {
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL
  };

  if (!templateVars.longURL) {
     return res.send("error");
    return;
  } else {
    res.render("urls_show", templateVars);
    return;
  }
});

app.post("/urls", (req, res) => {
  let code = generateRandomString();
  const user = users[req.cookies.user_id];
  urlDatabase[code] = {
    "longURL":req.body.longURL,
    "userID":req.cookies.user_id
};
  console.log(urlDatabase);

  if (!user) {
    return res.send("You cannot shorten URLS because you are not logged in!")
  } else {
    res.redirect(`/urls/${code}`);
  }
});


app.get("/u/:id", (req, res) => {
  const id = req.params.id
  if (!urlDatabase[id]) {
    return res.send("THIS ID DOES NOT EXIST")
  } else {
    const longURL = urlDatabase[req.params.id].longURL
    res.redirect(longURL);
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  delete urlDatabase[id];
  console.log(urlDatabase)
  res.redirect(`/urls`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  res.redirect(`/urls/${id}`);
});

app.post("/urls/:id/edit", (req, res) => {
  const id = req.params.id;
  const newURL = req.body.newURL;
  urlDatabase[id].longURL = newURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  console.log("password", req.body.email);
  const e_mail = req.body.email;
  const givenPassword = req.body.password;

  if (findUser(e_mail) === null) {
    res.send("Please register");
    return;
  }
  const password = findUser(e_mail).password;
  const id = findUser(e_mail).id;
  if (findUser(e_mail)) {
    if (givenPassword !== password) {
      res.send("Wrong Password");
      return;
    }
  }
  if (findUser(e_mail) && givenPassword === password) {
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.get("/login", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  const user = users[req.cookies.user_id];

  if (user) {
    return res.redirect("/urls");
  } else {
    res.render("urls_login", templateVars);
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/register", (req, res) => {
  const templateVars = {
    user: users[req.cookies.user_id],
  };
  const user = users[req.cookies.user_id];
  if (user) {
    return res.redirect("/urls");
  } else {
    res.render("urls_register", templateVars);
  }
});

app.post("/register", (req, res) => {
  const randomID = generateRandomString();
  const e_mail = req.body.email;
  const password = req.body.password;
  const user = users[req.cookies.user_id];

  if (!e_mail || !password) {
    console.log("USER no pass", users);
    res.send("Please enter a valid email/password!");
    return;
  }
  if (findUser(e_mail)) {
    res.send("Email Already Exists");
    return;
  }
  users[randomID] = { id: randomID, email: e_mail, password: password };
  res.cookie("user_id", randomID);
  console.log("users good", users);
  return res.redirect("/urls");
});

////////////////////////////////////////////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
