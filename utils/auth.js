const { admin, db } = require('./admin');

module.exports = (req, res, next) => {
	if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
		idToken = req.headers.authorization.split('Bearer ')[1];
	}
	else {
		console.error('No token found');
		return res.status(403).json({ error: 'Unauthorized' });
	}

	admin
		.auth()
		.verifyIdToken(idToken)
		.then((decodedToken) => {
			req.user = decodedToken;
			return db.collection('users').where('userId', '==', req.user.uid).limit(1).get();
		})
		.then((data) => {
			req.user.name = data.docs[0].data().name;
			req.user.email = data.docs[0].data().email;
			req.user.totalProducts = data.docs[0].data().totalProducts;
			req.user.totalAmount = data.docs[0].data().totalAmount;
			req.user.cart = data.docs[0].data().cart;
			req.user.selledProducts = data.docs[0].data().selledProducts;
			return next();
		})
		.catch((err) => {
			console.error('Error while verifying token ', err);
			return res.status(403).json(err);
		});
};
