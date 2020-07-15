exports.createProductValidator = (newProduct) => {
	const errors = {};
	if (newProduct.model.trim() === '') {
		errors.model = 'Model must not be empty!';
	}
	if (newProduct.category.trim() === '') {
		errors.category = 'Category must not be empty!';
	}
	if (newProduct.brand.trim() === '') {
		errors.brand = 'brand must not be empty!';
	}
	if (newProduct.state.trim() === '') {
		errors.state = 'state must not be empty!';
	}
	if (newProduct.city.trim() === '') {
		errors.city = 'city must not be empty!';
	}
	if (newProduct.locality.trim() === '') {
		errors.locality = 'locality must not be empty!';
	}
	if (newProduct.title.trim() === '') {
		errors.title = 'title must not be empty!';
	}
	else {
		if (newProduct.title.length < 250) {
			errors.title = 'title should be at least 250 characters !';
		}
		else if (newProduct.title.length > 350) {
			errors.title = 'title should not exceed 350 characters !';
		}
	}
	if (newProduct.description.trim() === '') {
		errors.description = 'description must not be empty!';
	}
	else {
		if (newProduct.description.length < 650) {
			errors.description = 'description should be at least 650 characters !';
		}
		else if (newProduct.description.length > 750) {
			errors.description = 'description should not exceed 750 characters !';
		}
	}
	if (newProduct.contact.trim() === '') {
		errors.contact = 'contact must not be empty!';
	}
	else {
		if (newProduct.contact.length !== 10) {
			errors.contact = 'Contact should be a valid mobile number !';
		}
	}
	if (isNaN(newProduct.zip)) {
		errors.zip = 'zip must be a number!';
	}
	if (isNaN(newProduct.price)) {
		errors.price = 'price must be a number!';
	}
	return errors;
};
