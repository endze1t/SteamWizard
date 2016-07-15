function removeAllActiveNavbar(){
	$(".navBar a div").each(function(index, element){
		$(element).removeClass('navBarActive');
	});
}

$(document).ready(function(){
	$(".navBar a").each(function(index, element){
		$(element).click(function(){
			removeAllActiveNavbar();
			$(element).find('div').first().addClass('navBarActive');
		});
	});
	$('.navBar a')[0].click();
	
	//checkboxes
	$(".element div input[type=checkbox]").change(function(checkbox){
		//todo: load value from storage, save when clicked
		console.log('checkbox change');
		console.log(checkbox);
	});
});