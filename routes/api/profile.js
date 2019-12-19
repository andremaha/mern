const express = require('express')
const router = express.Router()
const auth = require('../../middleware/auth')
const { check, validationResult } = require('express-validator/check')

const Profile = require('../../models/Profile')
const User = require('../../models/User')

// @route 	GET 	api/profile/me
// @desc	Current user profile
// @access	Private
router.get('/me', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar'])

		if (!profile) {
			return res.status(400).json({ errors: [{ message: 'There is no profile for this user'}] })
		}

		return res.json(profile)
	} catch(err) {
		console.error(err.message)
		return res.status(500).json({ errors: [ { message: err.message } ] })
	}
})

router.put('/', auth, (req, res) => res.send('put is working'))

// @route 	POST 	api/profile
// @desc	Create or update a user profile
// @access	Private
router.post('/', [
	auth,
	check('status', 'Status is required')
		.not()
		.isEmpty(),
	check('skills', 'Skills are required')
		.not()
		.isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req)
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const {
			company,
			website,
			location,
			bio,
			status,
			githubusername,
			skills,
			youtube,
			facebook,
			twitter,
			instagram,
			linkedin
		} = req.body

		// Build profile object
		const profileFields = {}

		profileFields.user = req.user.id

		if (company) {
			profileFields.company = company
		}
		if (website) {
			profileFields.website = website
		}
		if (location) {
			profileFields.location = location
		}
		if (bio) {
			profileFields.bio = bio
		}
		if (status) {
			profileFields.status = status
		}
		if (githubusername) {
			profileFields.githubusername = githubusername
		}
		if (skills) {
			profileFields.skills = skills.split(',').map(skill => skill.trim()).join()
		}

		// Build social object
		profileFields.social = {}
		if (youtube) {
			profileFields.social.youtube = youtube
		}
		if (twitter) {
			profileFields.social.twitter = twitter
		}
		if (facebook) {
			profileFields.social.facebook = facebook
		}
		if (linkedin) {
			profileFields.social.linkedin = linkedin
		}
		if (instagram) {
			profileFields.social.instagram = instagram
		}

		try {
			let profile = await Profile.findOne({ user: req.user.id })

			// Update
			if(profile) {
				profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true })

				return res.json(profile)
			}

			// Create
			profile = new Profile(profileFields)

			await profile.save()

			return res.status(201).json(profile)


		} catch(err) {
			console.error(err.message)
			res.status(500).json({ errors: [ { message: err.message } ] })
		}

	})

// @route 	GET 	api/profile
// @desc 	Get all profiles
// @access 	Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar'])
		return res.json(profiles)
	} catch(err) {
		console.error(err.message)
		res.status(500).json({ errors: [ { message: err.message } ] })
	}
})

// @route 	GET 	api/profile/user/:user_id
// @desc 	Get a user profile
// @access 	Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar'])
		
		if (!profile) {
			return res.status(404).json({ errors: [{ message: "There is no profile for this user"} ] })
		}

		return res.json(profile)
	} catch(err) {
		console.error(err.message)
		if (err.kind === 'ObjectId') {
			return res.status(404).json({ errors: [{ message: "There is no profile for this user"} ] })
		}

		res.status(500).json({ errors: [ { message: err.message } ] })
	}
})

// @route 	DELETE 	api/profile
// @desc 	Delete profile, user & posts
// @access 	Private
router.delete('/', auth, async (req, res) => {
	try {
		// TODO: remove the posts when we add them
		
		// Remove the profile
		await Profile.findOneAndRemove({ user: req.user.id })

		// Remove the user
		await User.findOneAndRemove({ _id: req.user.id })

		return res.json({ message: "Profile and User removed"})
	} catch(err) {
		console.error(err.message)
		res.status(500).json({ errors: [ { message: err.message } ] })
	}
})

// @route 	PUT 	api/profile/experience
// @desc 	Add experience to the profile
// @access 	Private
router.put('/experience', [auth, 
		check('title', 'Title is required')
			.not()
			.isEmpty(),
		check('company', 'Company is required')
			.not()
			.isEmpty(),
		check('from', 'From date is required')
			.not()
			.isEmpty()
	],
	async (req,res) => {

		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array()})
		}

		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		} = req.body

		const newExperience = {
			title,
			company,
			location,
			from,
			to,
			current,
			description
		}

		try {

			const profile = await Profile.findOne({ user: req.user.id })

			profile.experiences.unshift(newExperience)

			await profile.save()

			return res.json(profile)

		} catch(err) {
			console.error(err.message)
			res.status(500).json({ errors: [ { message: err.message } ] })
		}

})

// @route 	DELETE 	api/profile/experience/:exp_id
// @desc 	Delete experience from the profile
// @access 	Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id })

		if (!profile) {
			return res.status(404).json({ errors: [ { message: 'No experience found' } ] })
		}

		const newExperiences = profile.experiences.filter((experience) => {
			if (experience._id != req.params.exp_id) {
				return experience
			}
		})

		profile.experiences = newExperiences

		await profile.save(profile)

		return res.json(profile)
	} catch(err) {
		console.error(err.message)
		res.status(500).json({ errors: [ { message: err.message } ] })
	}
})




module.exports = router