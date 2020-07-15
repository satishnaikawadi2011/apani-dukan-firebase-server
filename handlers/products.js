const config = require('../utils/config');
const { db, admin } = require('../utils/admin');
const myGeocoder = require('../utils/geocode');
const { createProductValidator } = require('../utils/validators/productValidator');

exports.createProduct = (req, res) => {
	const { model, category, price, brand, contact, zip, state, city, locality, title, description } = req.body;
	const errors = createProductValidator(req.body);
	if (Object.keys(errors).length !== 0) {
		return res.status(400).json(errors);
	}
	// console.log(req.user);
	var location;
	const arrAddress = [
		state,
		city,
		locality
	];
	arrAddress.join(' ');
	myGeocoder(arrAddress, async (err, resp) => {
		if (err) {
			return console.log(err);
		}
		else {
			location = resp;
			const newProduct = {
				title,
				description,
				state,
				city,
				locality,
				zip,
				contact,
				price,
				brand,
				model,
				category,
				imageUrl    : 'https://cdn.pixabay.com/photo/2020/05/27/18/51/artisan-5228449__340.png',
				owner       : req.user.uid,
				location
			};
			try {
				const doc = await db.collection('products').add(newProduct);
				const resProduct = newProduct;
				resProduct.productId = doc.id;
				const userDoc = await db.doc(`/users/${req.user.email}`).get();

				if (!userDoc.exists) {
					return res.status(404).json({ error: 'User Not Found !' });
				}
				await userDoc.ref.update({
					selledProducts : [
						doc.id,
						...userDoc.data().selledProducts
					]
				});

				res.status(201).json({ product: newProduct });
			} catch (err) {
				res.status(500).json({ error: 'something went wrong' });
				console.error(err);
			}
		}
	});
};

exports.uploadImage = (req, res) => {
	const BusBoy = require('busboy');
	const path = require('path');
	const os = require('os');
	const fs = require('fs');
	db
		.collection('products')
		.doc(req.params.productId)
		.get()
		.then((doc) => {
			if (!doc.exists) {
				return res.status(404).json({ error: 'No product found!' });
			}
			else if (doc.data().owner !== req.user.uid) {
				return res.status(403).json({ error: 'You are not allowed to upload image for this product' });
			}
		})
		.catch((err) => {
			console.error(err);
		});

	const busboy = new BusBoy({ headers: req.headers });
	let imageFileName;
	let imageToBeUploaded = {};

	busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
		if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
			return res.status(400).json({ error: 'Wrong file type submitted' });
		}
		const imageExtension = filename.split('.')[filename.split('.').length - 1];
		imageFileName = `${Math.round(Math.random() * 100000000)}.${imageExtension}`;
		const filePath = path.join(os.tmpdir(), imageFileName);
		imageToBeUploaded = { filePath, mimetype };
		file.pipe(fs.createWriteStream(filePath));
	});

	busboy.on('finish', () => {
		admin
			.storage()
			.bucket(config.storageBucket)
			.upload(imageToBeUploaded.filePath, {
				resumable : false,
				metadata  : {
					metadata : {
						contentType : imageToBeUploaded.mimetype
					}
				}
			})
			.then(() => {
				const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`;
				return db.doc(`/products/${req.params.productId}`).update({ imageUrl });
			})
			.then(() => {
				return res.json({ message: 'Image uploaded successfully !' });
			})
			.catch((err) => {
				console.error(err);
				return res.status(500).json({ error: err.code });
			});
	});
	busboy.end(req.rawBody);
};

exports.addToCart = async (req, res) => {
	// console.log(req.user);
	const inCart = req.user.cart.find((id) => id === req.params.productId);
	if (inCart) {
		return res.status(400).json({ error: 'Product already present in the cart !' });
	}
	try {
		const productDoc = await db.doc(`/products/${req.params.productId}`).get();
		if (!productDoc.exists) {
			return res.status(404).json({ error: 'Product not found !' });
		}
		await db.doc(`/users/${req.user.email}`).update({
			cart : [
				req.params.productId,
				...req.user.cart
			]
		});
		await res.status(200).json({ message: 'Product added to cart successfully !' });
	} catch (err) {
		console.error(err);
	}
};

exports.removeFromCart = async (req, res) => {
	const inCart = req.user.cart.find((id) => id === req.params.productId);
	if (!inCart) {
		return res.status(400).json({ error: 'Product not present in the cart !' });
	}
	try {
		await db.doc(`/users/${req.user.email}`).update({
			cart : req.user.cart.filter((id) => id !== req.params.productId)
		});
		await res.status(200).json({ message: 'Product removed from cart successfully !' });
	} catch (err) {
		console.error(err);
	}
};

exports.getAllProducts = async (req, res) => {
	try {
		const productData = await db.collection('products').get();
		const products = [];
		productData.forEach((doc) => {
			products.push({ productId: doc.id, ...doc.data() });
		});
		await res.status(200).json({ products });
	} catch (err) {
		console.error(err);
	}
};

exports.getProductById = async (req, res) => {
	try {
		const doc = await db.doc(`/products/${req.params.productId}`).get();
		if (!doc.exists) {
			return res.status(404).json({ error: 'Product not found !' });
		}
		await res.json({ product: { productId: doc.id, ...doc.data() } });
	} catch (err) {
		console.error(err);
	}
};

exports.getMyProducts = async (req, res) => {
	try {
		const productData = await db.collection('products').where('owner', '==', req.user.uid).get();
		const products = [];
		productData.forEach((doc) => {
			products.push({ productId: doc.id, ...doc.data() });
		});
		await res.status(200).json({ products });
	} catch (err) {
		console.error(err);
	}
};

exports.clearMyCart = async (req, res) => {
	try {
		await db.doc(`/users/${req.user.email}`).update({ cart: [] });
		await res.json({ message: 'Cart cleared successfully !' });
	} catch (err) {
		console.error(err);
	}
};

exports.getMyCart = async (req, res) => {
	try {
		const cart = [];
		for (let index = 0; index < req.user.cart.length; index++) {
			const id = req.user.cart[index];
			const doc = await db.doc(`/products/${id}`).get();
			const userData = await db.collection('users').where('userId', '==', doc.data().owner).limit(1).get();
			cart.push({ ...doc.data(), owner: userData.docs[0].data().email });
		}
		await res.status(200).json({ cart });
	} catch (err) {
		console.error(err);
	}
};

exports.updateProductById = async (req, res) => {
	const updates = Object.keys(req.body);
	const doc = await db.doc(`/products/${req.params.productId}`).get();
	if (!doc.exists) {
		return res.status(404).json({ error: 'Product not found' });
	}
	const product = doc.data();
	if (req.user.uid !== product.owner) {
		return res.status(403).json({ error: 'You are not allowed to update this product' });
	}
	const allowedUpdates = [
		'title',
		'description',
		'contact',
		'state',
		'city',
		'locality',
		'zip'
	];
	const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

	if (!isValidOperation) {
		return res.status(422).json({ error: 'Invalid updates !!' });
	}
	if (!req.body.state) {
		req.body.state = product.state;
	}
	if (!req.body.city) {
		req.body.city = product.city;
	}
	if (!req.body.locality) {
		req.body.locality = product.locality;
	}

	const arrAddress = [
		req.body.state,
		req.body.city,
		req.body.locality
	];
	arrAddress.join(' ');
	myGeocoder(arrAddress, async (err, resp) => {
		if (err) {
			return console.log(err);
		}
		else {
			product.location.longitude = resp.longitude;
			product.location.latitude = resp.latitude;
			try {
				updates.forEach((update) => (product[update] = req.body[update]));
				const updatedProduct = product;
				await db.doc(`/products/${req.params.productId}`).update({ ...product });
				res.json({ product: updatedProduct });
			} catch (e) {
				console.error(e);
			}
		}
	});
};

exports.deleteProductById = async (req, res) => {
	try {
		const doc = await db.doc(`/products/${req.params.productId}`).get();
		if (!doc.exists) {
			return res.status(404).json({ error: 'Product not found !' });
		}
		const path = doc.data().imageUrl;
		const filename = path.split('/')[7].split('?')[0];
		await db.doc(`/products/${req.params.productId}`).delete();
		const storageRef = await admin.storage().bucket(config.storageBucket).file(`${filename}`).delete();
		await res.json({ message: 'Product deleted succesfully !' });
	} catch (err) {
		console.error(err);
	}
};
