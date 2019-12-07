const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator/check')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')

const User = require('../../models/User')

// @route 	POST 	api/users
// @desc	Register user
// @access	Public
router.post('/', [
		check('name', 'Name is required')
			.not()
			.isEmpty(),
		check('email', 'Please include a valid email')
			.isEmail(),
		check('password', 'A password should be at least 6 characters long')
			.isLength({ min: 6 })
	], 
	async (req, res) => {

		// Check for validation errors
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({
				errors: errors.array()
			})
		}

		const { name, email, password } = req.body
		
		try {

			// See if user exits
			
			let user = await User.findOne({ email })

			if (user) {
				return res.status(400).json({ errors: [{ message: "User with this email already exists" }] })
			}

			// Get users gravatar
			
			const avatar = gravatar.url(email, {
				s: '200',
				r: 'pg',
				d: 'mm'
			})

			user = new User({
				name,
				email,
				avatar,
				password
			})

			// Encrypt password
			
			const salt = await bcrypt.genSalt(10)

			user.password = await bcrypt.hash(password, salt)

			await user.save()

			// Return jsonwebtoken
			
			return res.send("User registered")

		} catch (err) {
			console.error(err.message)
			res.status(500).json({ errors: [ { message: err.message } ] })
		}
		
		
		
	
})

module.exports = router