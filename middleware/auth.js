const jwt = require('jsonwebtoken')
const config = require('config')

module.exports = function(req, res, next) {
	// Get token from the header
	const token = req.header('x-auth-token')

	// Check if token header was provided
	if (!token) {
		return res.status(401).json({ errors: [{ message: 'No token header, authorization denied' }]})
	}

	// Verify token
	try {
		const decoded = jwt.verify(token, config.get('jwtSecret'))

		req.user = decoded.user

		next()
	} catch(err) {
		return res.status(401).json({ errors: [{ message: 'Token is not valid, can not authorize the user' }]})
	}
}