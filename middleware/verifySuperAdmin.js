// const jwt = require('jsonwebtoken');
// const { SUPER_ADMIN_USERNAME } = process.env;

// const verifySuperAdmin = (req, res, next) => {
//   const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

//   if (!token) {
//     return res.status(401).json({ msg: 'Token is required' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
//     console.log(decoded);
//     if (decoded.role !== 'superadmin') {
//       return res.status(403).json({ msg: 'Access denied: Not a super admin' });
//     }

//     // Attach user data to the request for further use in the route
//     req.user = decoded;
//     next(); // Proceed to the next middleware/route handler
//   } catch (err) {
//     console.error(err);
//     return res.status(400).json({ msg: 'Invalid token' });
//   }
// };

// module.exports = verifySuperAdmin;
































const jwt = require('jsonwebtoken');
const { SUPER_ADMIN_USERNAME } = process.env;

const verifySuperAdmin = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Get token from Authorization header

  if (!token) {
    return res.status(401).json({ msg: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    console.log(decoded);
    if (decoded.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Access denied: Not a super admin' });
    }

    // Attach user data to the request for further use in the route
    req.user = decoded;
    next(); // Proceed to the next middleware/route handler
  } catch (err) {
    console.error(err);
    return res.status(400).json({ msg: 'Invalid token' });
  }
};

module.exports = verifySuperAdmin;
