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
    // Netlify Forms doesn't return a crafted message body like the old
    // sender.php did — show a fixed success message instead of `response`.
    $formMessages.text("Thank You! I'll get back to you soon.");
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