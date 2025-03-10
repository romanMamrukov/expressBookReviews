const express = require("express");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const customer_routes = require("./router/auth_users.js").authenticated;
const genl_routes = require("./router/general.js").general;

const app = express();

app.use(express.json());

app.use(
  "/customer",
  session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true,
  }),
);

app.use("/customer/auth/*", function auth(req, res, next) {
  // Check for authorization header or session
  const authHeader = req.headers.authorization;
  let token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    // Get token from Authorization header
    token = authHeader.split(" ")[1];
  } else if (req.session.authorization) {
    // Get token from session as fallback
    token = req.session.authorization.accessToken;
  } else {
    return res.status(401).json({ message: "Authorization token is missing" });
  }

  // Verify token
  jwt.verify(token, "your_secret_key", (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token is invalid or expired" });
    }
    // Add user data to the request
    req.user = user;
    next();
  });
});

const PORT = process.env.PORT || 3000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log("Server is running"));
