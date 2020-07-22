const functions = require('firebase-functions');
const express = require('express');
const auth = require('./utils/auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const os = require('os');
const { db, admin } = require('./utils/admin');
const config = require('./utils/config');
const fileUpload = require('./middlewares/file-upload');

const userRouter = require('./routes/users');
const { signup, login } = require('./handlers/users');
const {
	getAllProducts,
	createProduct,
	addToCart,
	removeFromCart,
	getMyProducts,
	getProductById,
	clearMyCart,
	getMyCart,
	updateProductById,
	deleteProductById
} = require('./handlers/products');
const { clearCart } = require('../../server/controllers/product-controllers');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

// -----------------------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------------------------------

// app.post('/signup', signup);

// // login route
// app.post('/login', login);
app.use('/api/users', userRouter);

// -------------------------------------------------------------------------------------------------------------------------------------------------------
// --------------------------------------------------------------------------------------------------------------------------------------------------

// ------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------

app.post('/product', auth, createProduct);

// app.post('/product/:productId/upload', auth, uploadImage);

app.post('/product/:productId/addToCart', auth, addToCart);

app.delete('/product/:productId/removeFromCart', auth, removeFromCart);

app.get('/products', getAllProducts);

app.get('/products/me', auth, getMyProducts);

app.get('/products/:productId', auth, getProductById);

app.delete('/me/clearCart', auth, clearMyCart);

app.get('/me/cart', auth, getMyCart);

app.patch('/product/:productId/update', auth, updateProductById);

app.delete('/products/:productId', auth, deleteProductById);

app.post('/products/:productId/upload', auth, fileUpload.single('image'), (req, res) => {
	admin
		.storage()
		.bucket(config.storageBucket)
		.upload(req.file.path, {
			resumable : false,
			metadata  : {
				metadata : {
					contentType : req.file.mimetype
				}
			}
		})
		.then(() => {
			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${req.file
				.filename}?alt=media`;
			return db.doc(`/products/${req.params.productId}`).update({ imageUrl });
		})
		.then(() => {
			res.json({ message: 'Image uploaded successfully !!' });
		})
		.catch((err) => {
			console.error(err);
			return res.status(500).json({ error: err.code });
		});
});
// ------------------------------------------------------------------------------------------------------------------------------------------------------
// ------------------------------------------------------------------------------------------------------------------------------------------------------

// exports.api = functions.https.onRequest(app);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
