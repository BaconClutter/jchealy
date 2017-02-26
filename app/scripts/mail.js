/* jshint newcap: false, camelcase: false */
'use strict';
		
$('#contactForm').submit(function() {
	event.preventDefault();
	var $contactForm = $('#contactForm'),
		$formData = $contactForm.serialize(),
		$formMessages = $('#form-messages');
	$.ajax({
		type: 'POST',
		url: $contactForm.attr('action'),
		data: $formData
	}).done(function(response){
		// Make sure that the formMessages div has the 'success' class.
    $formMessages.removeClass('error');
    $formMessages.addClass('success');
    // Set the message text.
    $formMessages.text(response);
    // Clear the form.
    $('#name').val('');
    $('#email').val('');
    $('#message').val('');
	}).fail(function(data){
		// Make sure that the formMessages div has the 'error' class.
		$formMessages.removeClass('success');
		$formMessages.addClass('error');
		if(data.responseText !== '') {
			$formMessages.text(data.responseText);
		} else {
			$formMessages.text('Something has gone terribly awry. Sorry about that.');
		}
	});
});