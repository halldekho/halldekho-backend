// const { SUPER_ADMIN_USERNAME, SUPER_ADMIN_PASSWORD } = process.env;

// const isSuperAdmin = (req, res, next) => {
//   const { email, password } = req.body;

//   // Log to check if the request body contains the correct email and password
//   console.log('SuperAdmin Middleware:', { email, password });

//   if (email === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
//     // If super admin credentials match, set the user as superadmin
//     req.user = { email: SUPER_ADMIN_USERNAME, role: 'superadmin' };
//     console.log('SuperAdmin matched:', req.user); // Debugging log for super admin match
//     return next(); // Proceed to the login logic
//   }

//   // If not super admin, move to the next middleware (regular login logic)
//   console.log('Not a super admin');
//   next();
// };

// module.exports = isSuperAdmin;























require('dotenv').config();

const isSuperAdmin = (req, res, next) => {
  const { email, password } = req.body;

  if (email === process.env.SUPER_ADMIN_USERNAME) {
    if (password === process.env.SUPER_ADMIN_PASSWORD) {
      req.user = {
        email,
        role: "superadmin",
      };
      return next();
    } else {
      return res.status(401).json({ msg: "Invalid super admin credentials" });
    }
  }

  next();
};

module.exports = isSuperAdmin;

