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
		// Never render the response body. The old sender.php returned a short
		// human-readable string, but Netlify returns a full HTML error page —
		// dumping that here fills the page with raw markup. Show a fixed
		// message and keep the detail in the console for debugging.
		$formMessages.text('Something has gone terribly awry. Sorry about that. You can also reach me at yo@jchealy.com.');
		if (window.console && console.error) {
			console.error('Contact form submission failed:', data.status, data.statusText);
		}
	});
});