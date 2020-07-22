const express = require('express');
const router = express.Router();

const { signup, login } = require('../handlers/users');

router.post('/signup', signup);

router.post('/login', login);

// router.post('/upload', fileUpload.single('image'), (req, res) => {
// 	admin
// 		.storage()
// 		.bucket(config.storageBucket)
// 		.upload(req.file.path, {
// 			resumable : false,
// 			metadata  : {
// 				metadata : {
// 					contentType : req.file.mimetype
// 				}
// 			}
// 		})
// 		.then(() => {
// 			const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${req.file
// 				.filename}?alt=media`;
// 			res.json({ imageUrl });
// 		})
// 		.catch((err) => {
// 			console.error(err);
// 			return res.status(500).json({ error: err.code });
// 		});
// });

module.exports = router;
