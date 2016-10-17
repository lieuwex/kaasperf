var $form = document.getElementsByTagName('form')[0];
var $name = document.getElementById('name');
var $description = document.getElementById('description');
var $submit = document.getElementById('submit');

var create = document.querySelector('meta[key="create-mode"]').getAttribute('value') === '1';
var publicId = document.querySelector('meta[key="publicId"]').getAttribute('value');
var privateId = document.querySelector('meta[key="privateId"]').getAttribute('value');

$form.addEventListener('submit', function (event) {
	event.preventDetault();
});

$submit.addEventListener('click', function (event) {
	event.preventDetault();
	fetch(create ? `/create` : `/${publicId}/edit/${privateId}`, {
		method: 'post',
		body: new FormData($form),
	}).then(r => console.log(r));
});
