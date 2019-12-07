const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const auth = require('../../middleware/auth')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')

const User = require('../../models/User')

// @route 	GET 	api/auth
// @desc	Authenticate user
// @access	Private
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password')
		return res.json(user)
	} catch(err) {
		return res.status(401).json({ errors: [{ message: err.message }]})
	}
})

// @route 	POST 	api/auth
// @desc	Login user & get token
// @access	Private
router.post('/', [
		check('email', 'Please include a valid email')
			.isEmail(),
		check('password', 'Please provide a password')
			.exists()
	], 
	async (req, res) => {

		// Check for validation errors
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			})
		}

		const { email, password } = req.body
		
		try {

			// See if user exits
			let user = await User.findOne({ email })

			if (!user) {
				return res.status(400).json({ errors: [{ message: "Invadid username and/or password" }] })
			}

			const passwordsMatch = await bcrypt.compare(password, user.password)

			if (!passwordsMatch) {
				return res.status(400).json({ errors: [{ message: "Invadid username and/or password" }] })
			}

			// Return jsonwebtoken
			const payload = {
				user: {
					id: user.id
				}
			}

			jwt.sign(
				payload, 
				config.get('jwtSecret'),
				{ expiresIn: 36000 },
				(err, token) => {
					if (err) throw err
					return res.json({ token })
				}
			)

		} catch (err) {
			console.error(err.message)
			res.status(500).json({ errors: [ { message: err.message } ] })
		}
		
		
		
	
})

module.exports = router