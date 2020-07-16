const { db, admin } = require('../utils/admin');
const config = require('../utils/config');
const firebase = require('firebase');
firebase.initializeApp(config);

exports.signup = (req, res) => {
	// console.log(req);
	const newUser = {
		email    : req.body.email,
		password : req.body.password,
		name     : req.body.name
	};
	const errors = {};
	if (newUser.email.trim() === '') {
		errors.email = 'Email must not be empty !';
	}
	else {
		const regEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		if (!newUser.email.match(regEx)) {
			errors.email = 'Email must be a valid email address !';
		}
	}

	if (newUser.password === '') {
		errors.password = 'Password must not be empty !';
	}

	if (newUser.name.trim() === '') {
		errors.name = 'Name must not be empty !';
	}
	if (Object.keys(errors).length !== 0) {
		return res.status(400).json(errors);
	}

	// const noImg = 'no-img.png';

	let userId, token;
	db
		.doc(`/users/${newUser.email}`)
		.get()
		.then((doc) => {
			if (doc.exists) {
				return res.status(400).json({ handle: 'User with this email already exist,Login instead !' });
			}
			else {
				return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password);
			}
		})
		.then((data) => {
			userId = data.user.uid;
			return data.user.getIdToken();
		})
		.then((idToken) => {
			token = idToken;
			const userCredentials = {
				name           : newUser.name,
				email          : newUser.email,
				createdAt      : new Date().toISOString(),
				userId,
				totalProducts  : 0,
				totalAmount    : 0,
				cart           : [],
				selledProducts : []
			};

			return db.doc(`/users/${newUser.email}`).set(userCredentials);
		})
		.then(() => {
			return res.status(201).json({ token });
		})
		.catch((err) => {
			console.error(err);
			if (err.code == 'auth/email-already-in-use') {
				return res.status(400).json({ email: 'Email is already in use' });
			}
			return res.status(500).json({ general: 'Something went wrong ,please try again !' });
		});
};

exports.login = (req, res) => {
	const user = {
		email    : req.body.email,
		password : req.body.password
	};

	const errors = {};
	if (user.email.trim() === '') {
		errors.email = 'Email must not be empty !';
	}
	else {
		const regEx = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
		if (!user.email.match(regEx)) {
			errors.email = 'Email must be a valid email address !';
		}
	}

	if (user.password === '') {
		errors.password = 'Password must not be empty !';
	}

	if (Object.keys(errors).length !== 0) {
		return res.status(400).json(errors);
	}

	firebase
		.auth()
		.signInWithEmailAndPassword(user.email, user.password)
		.then((data) => {
			return data.user.getIdToken();
		})
		.then((token) => {
			return res.json({ token });
		})
		.catch((err) => {
			console.error(err);

			return res.status(403).json({ general: 'Wrong credentials,please try again !' });
		});
};
