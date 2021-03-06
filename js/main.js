var service_label = "Provide Service";
var no_service_label = "Do not Provide Service";
function displayAlert( msg ){
	console.log( msg );
	Materialize.toast( msg, 4000);
}
function getServiceHost(){
	$( "#innerContentHead" ).html( $("#progressdiv" ).html() );
	return "https://api.pactrak.com";
}

function tokenTest(){
	if( !$( '#token' ).val() ) { displayAlert( "Please log in first." ); return false;  }else{ return true; }
}

function getServiceURL( app ){ 
	if( tokenTest() ){
		var token = $( '#token' ).val();
		return getServiceHost()+"/"+app+"?token="+token; 
	}
} 

function sendJSONRequest( type, url, data, success_function, error_function ){
	console.log( type+" on: "+url );
	if ( success_function===undefined ) success_function = default_success;
	if ( error_function===undefined ) error_function = default_error;
	$.ajax({ type: type, url: url, data: data, dataType: "json", contentType: "application/json;charset=utf-8", success: success_function, error: error_function });
}
function default_success( data ){ console.log( data ); displayAlert( data ); }
function default_error( data ){ 
	var json_resp = JSON.parse( data.responseText ); 
	console.log( json_resp.message+"\n"+json_resp.developerMessage );	
	displayAlert(  json_resp.message );
}
function head_success( data, status, httpRequest ){
	var b64token = httpRequest.getResponseHeader("Authority");
	var decoded = window.atob( b64token ).split( "|" );
	$("#token").val( b64token );
	$( "#logon_msg" ).html( "<b>Authenticated</b>" );
	$("#addbook_block").removeClass( function(){  $(this).removeClass('disabled'); toggleMe( "#float_btn" ); $( "#innerContent" ).empty(); $( "#innerContentHead" ).empty();  } );
	$("#tabs").tabs( 'select_tab', 'addbook' );
}
function head_failure( httpRequest ){
	var msg = httpRequest.getResponseHeader("Authority"); 
	$( "#logon_msg" ).html( "Not authorized. [ "+msg+" ]");
	toggleMe( "#float_btn" );
	console.log( "Server Response: "+ msg );
	$( "#innerContent" ).empty();
	$( "#innerContentHead" ).empty();
}
function clearForm( form ){
	form.validate().resetForm();
	form.find("input[type=text], input[type=number], input[type=email], input[type=password], textarea").val("").removeClass('invalid error').prev( 'i' ).removeClass( "invalid error" );
	form.find( 'select' ).each(function (i, v) {
		$(this).prop("selectedIndex", 0);
	});
	form.find( 'label' ).removeClass('active');
}

//Display Table content
function displayTable( jsonArray ){
	$( "#innerContent" ).empty();
	$( "#innerContentHead" ).empty();
	var d = $("<div>").append( $("<h2>").text( "Station Address Book List" ) );
	var m = $( "<ul/>" ).addClass( 'collection' );

	$.each( jsonArray, function( k, v ){
		var li = $( "<li/>" ).addClass( 'collection-item avatar' );
		var i = $( "<i/>" ).addClass( 'material-icons circle' ).text( 'folder' );
		var title = $( "<span/>").addClass( 'title' );
		var l1 = $( "<p/>" );
		var l2 = $( "<p/>" );
		var sec = $( "<a href='#!' class='secondary-content'> " );
		sec.append( $( "<i class='material-icons'>" ).text( 'mode edit' ) );
		title.append( v.account );
		l1.append( v.name );
		l2.append( presentFlatEntryValuesTable( v, 'address1', 'address2', 'city', 'state', 'zip', 'country', 'contact', 'phone', 'comments' ) );
		li.append( i ).append( title ).append( l1 ).append( l2 ).append( sec );
		m.append( li );
	});
	$( "#innerContent" ).html( d.append( m ) );

}

function displayTableAccordion( jsonArray ){
	$( "#innerContent" ).empty();
	$( "#innerContentHead" ).empty();
	var d = $("<div/>").append( $("<h2>").text( "Station Address Book List" ) );
	var m = $( "<ul/>" ).addClass( 'collapsible' ).attr( {"data-collapsible": "accordion", "id": "entrylist"} );

	$.each( jsonArray, function( k, o ){
		var v = o.customer;
		var li = $( "<li/>" );
		var header = $( "<div/>" ).addClass( "collapsible-header" );
		var i = $( "<i/>" ).addClass( 'material-icons editme' ).text( 'subtitles' );
		var sec = $( "<a/>" ).attr( "href", "#!").addClass( "secondary-content" );
		var body = $( "<div/>" ).addClass( "collapsible-body" ).attr( "for", v.account );
		var upd = $( "<i/>" ).addClass( 'material-icons' ).attr( "for", v.account ).text( 'mode edit' ); //.attr( 'type', 'update' );
		upd.click(function( event ) {
			console.log( 'Update button clicked '+$(this).attr( 'for' ) );
			var div = $( "div[for="+$(this).attr( 'for' ) +"]" );
			var autoclose = false;
			if( div.is( ":hidden" ) ) { div.show(); autoclose = true; }
			var arr = div.find( "table" ).tableToJSON();
			if( autoclose ) div.hide();

			var obj;
			if ( arr.length === 0 ){
				obj = {};
			}else{
				obj = arr[ 0 ];	
			}
			obj['account'] = v.account;
			setupUpdateForm( obj );

			event.preventDefault();
		});

		sec.append( upd );  
		var lt = $( "<span/>" ).addClass( "col s12 flow-text" ).append( i ).append( joinIntoSpan( v.account, v.name ) );

		header.append( lt ); 
		var l1 = $( "<p/>" ).addClass("flow-text");
		l1.append( presentFlatEntryValuesTable( v, 'address1', 'address2', 'city', 'state', 'zip', 'country', 'contact', 'phone', 'comments' ) );
		body.append( l1 );
		var t = presentEntryContacts( v.account, o.customer_contacts, "Contacts" );
		body.append(  t  );


		li.append( setServiceSwitch( v.provide_service, v.account )  ).append( sec ).append( header ).append( body );
		m.append( li );
	});
	$( "#innerContent" ).html( d.append( m ) );
	$( "#entrylist").collapsible();
}

function joinIntoSpan(){
	var l = $( "<span/>" );
	for( var i=0; i < arguments.length; i++) {
		if( i > 0 ){ l.append( "&nbsp;" ); }
		if ( arguments[i] ){ l.append( $('<span>').text( arguments[i] ) ); }
	}
	return l;
}
function toTableRow(){
	var r = $( "<tr/>" );
	for( var i=0; i < arguments.length; i++) {
		r.append(  $( "<td/>" ).html( arguments[ i ] ) );
	}
	return r; 
}

function toTableHeaderRow(){
	var r = $( "<tr/>" );
	for( var i=0; i < arguments.length; i++) {
		r.append(  $( "<th/>" ).html( arguments[ i ] ) );
	}
	return r; 
}
/* 
 *  This function expects as the first parameter the Object and then a list of the object keys to display.
 */
function presentEntryValuesTable(){
	var table = $( "<table/>" ).addClass( 'responsive-table striped smalltxt' );
	var obj = arguments[ 0 ];
	for( var i=1; i < arguments.length; i++) {
		var title = arguments[ i ];
		if( obj[ title ] ){
			var t = $( "<b/>" ).text( title+":" );
			table.append( toTableRow( t, obj[ title ] ) );
		}
	}
	return table;
}

function presentFlatEntryValuesTable(){
	var obj = arguments[ 0 ];
	var table = $( "<table/>" ).addClass( 'responsive-table striped smalltxt' );
	var thead = $( "<thead/>" );
	var header = $( "<tr/>" );
	var row = $( "<tr/>");
	var hasValues = false;

	for( var i=1; i < arguments.length; i++) {
		var title = arguments[ i ];
		if( obj[ title ] ){
			header.append( $("<th/>").text( title ) );
			row.append( $("<td/>").text( obj[ title ] ) );
			if( !hasValues ) hasValues = true;
		}
	}
	if( hasValues )
		table.append( thead.append( header ) ).append( row );
	return table;
}

function presentEntryContacts( account, arrayContact, tableCaption ){
	var l2 = $( "<p/>" );
	var sec = $( "<a/>" ).attr( "href", "#!").addClass( "secondary-content modal-trigger" );
	sec.append( $( "<i class='material-icons'>" ).attr( "for", account ).text( 'add' ) );
	sec.click(function( event ){
		clearForm( $( "#contactForm" ) );
		$( "#contactId" ).text( $(this).find("i").attr('for') );
		$("#addContact").openModal();
		$("label[for=name]").addClass('active');
	});
	var list = $( "<ul/>").addClass( "collection with-header").attr( "for", account );
	var h = $( "<li/>" ).addClass("collection-header").append( $("<h4/>").text( tableCaption ).append( sec ) );
	list.append( h );
	list.append( createEntryItem( arrayContact, account ) );
	return l2.append( list );		
}

function createEntryItem( arrayContact, account ){
	var table = createHTMLContactTable();
	if( arrayContact ){
		$.each( arrayContact, function( k, v ){
			table.append( toHTMLContactRow( v ) );
		});
	}
	return $( "<li/>" ).addClass( "collection-item flow-text" ).attr( "contact", account  ).html( table );
}

function createHTMLContactTable( title ){
	var table = $( "<table/>" ).addClass( 'responsive-table smallertxt' );
	if( title ){
		var cap = $("<caption/>").html( title );
		table.append( cap );
	}

	var thead = $( "<thead/>" );
	var hdrs = [ "name", "phone", "description", "email",  "send_notices" ];
	thead.append( toTableHeaderRow.apply( this, hdrs ) ) ;
	table.append( thead );
	return table;
}

function toHTMLContactRow( v ){
	var vals = [  v.name ];
	( v.phone ) ? vals.push( v.phone ) : vals.push( "" );
	( v.description ) ? vals.push( v.description ) : vals.push( "" );
	( v.email ) ? vals.push( v.email ) : vals.push( "" );
	vals.push( setNoticeSwitch( v.send_notices, v.id, v.name ) );
	var row = toTableRow.apply( this, vals );
	var sec2 = $( "<a/>" ).attr( "href", "#!").addClass( "secondary-content" );
	sec2.append( $( "<i class='material-icons'>" ).attr( {"for": v.id, "name": v.name } ).text( 'delete' ) );
	sec2.click(function( event ){
		var id = $(this).find("i").attr('for');
		var n = $(this).find("i").attr('name');

			var url = getServiceURL( "zipx/addresses/"+id+"/contacts" );
			//url = url.concat( "&"+$.param( { name : n } ) );
			sendJSONRequest( "DELETE", url,JSON.stringify( { name : n } ), function( data ){
				var row = sec2.closest("tr");
				flashme( row, '#FF8566', 3500, function(){
					row.fadeOut( 300, function() {
						$( this ).remove();
						$( "#innerContentHead" ).empty();
					});
				});
				
				/*row.effect( "highlight",  { color: '#FF8566' }, 3500 ).fadeOut( 300, function() {
					$( this ).remove();
					$( "#innerContentHead" ).empty();
				});*/ 
				
			});
	});
	row.append( $("<td />").html( sec2 ) );
	return row;
}

/* return the html tag turned off or on depending on input value either Y or N */
function setServiceSwitch( value, for_id, cls ){
	var labelTxt = no_service_label;
	var input = $("<input/>").attr( {"type": "checkbox", "id":for_id } );
	if( cls !== null ){
		input.addClass( cls );
	}
	if( value.localeCompare ( "Y" ) === 0 ){
		input.attr( "checked", "");
		labelTxt = service_label;
		input.closest( "label" ).text( labelTxt );
	}

	var label = $("<label/>").attr( "for", for_id ).text( labelTxt );
	input.change( function(){ 
		var requesting = $(this).is(':checked');
		var obj = {};
		obj["customer"] = { provide_service: requesting ? "Y" : "N" };
		sendJSONRequest("PUT", getServiceURL( "zipx/addresses/"+for_id ), JSON.stringify( obj ), function( data ){ 
			console.log( "service completed: " + JSON.stringify( data ) );
			input.next( "label" ).text( !requesting ? no_service_label: service_label );
			$( "#innerContentHead" ).empty();
		}, function( data ) { 
			default_error( data );
			var label = no_service_label;
			if( !requesting ){
				label = service_label;
				input.prop( "checked", "true");
			}else{
				input.removeAttr( "checked" );
			}
			input.next( "label" ).text( label );
			$( "#innerContentHead" ).empty();
		});	
	} );
	return $("<span/>").addClass( "mright" ).append( input ).append( label );
}

function setNoticeSwitch(value, for_id, for_name ){
	var swtch = $( "<span/>" ).addClass( "switch" );
	var label = $( "<label/>" );
	var input = $( "<input/>" ).attr( "type", "checkbox" );
	if( for_id ){ input.attr( 	"for", for_id );  }
	if( for_name ){
		input.attr( 	"for_name", for_name ); 
		input.change( function(){
				var requesting = $(this).is(':checked');
				var for_id = $(this).attr( 'for' );
				var for_name = $(this).attr( 'for_name' );
				var obj = {};
				obj[ "id" ]= for_id;
				obj[ "name"] = for_name;
				obj["send_notices"] = requesting ? "Y" : "N";
				sendJSONRequest("PUT", getServiceURL( "zipx/addresses/"+for_id+"/contacts" ), JSON.stringify( obj ), function( data ){ 
					console.log( "service completed: " + JSON.stringify( data ) );
					$( "#innerContentHead" ).empty();
				}, function( data ) { 
					default_error( data );
					if( !requesting ){ input.prop( "checked", "true"); }else{ input.removeAttr( "checked" ); }
					$( "#innerContentHead" ).empty();
				});	
		}); 
	}
	if( value.localeCompare ( "Y" ) === 0 ){
		input.attr( "checked", "");	
	}
	var lever = $( "<span/>" ).addClass( "lever");

	label.append( "No" ).append( input ).append( lever ).append( " Yes" );
	swtch.append( label );
	return swtch;
}
//Json creation
function toJson( form ){
	return JSON.stringify( formToJson( form ) );
}
function formToJson( form, all ){
	if( all === 'undefined') all = false;
	var array = $(form).serializeArray();
	var json_obj = {};

	$.each( array, function(){
		if( all ){
			json_obj[this.name] = this.value || '';
		}else if( this.value ){
			json_obj[this.name] = this.value;
		}
	});
	return json_obj;
}
function toJsonObject( json_input ){
	return JSON && JSON.parse( json_input ) || $.parseJSON( json_input );
}
function setupUpdateForm( entry ){
	//entryFormModal
	var div = $( "div[for="+entry.account +"]" );
	var spn = div.prev().find( 'span' ).find('span');
	entry.name = spn.find( "span:last").text();
	$("#entryFormFooter").empty();
	clearForm( $("#entry-form") );
	$("#entryFormTitle").text( "Update entry "+ entry.account );
	fillValue( "#addaccount", entry.account, true );
	fillValue( "#addname", entry.name );
	fillValue( "#addaddress1", entry.address1 );
	fillValue( "#addaddress2", entry.address2 );
	fillValue( "#addcity", entry.city );
	fillValue( "#addstate", entry.state );
	fillValue( "#addzip", entry.zip );
	fillValue( "#addcountry", entry.country );
	fillValue( "#addcontact", entry.contact );
	fillValue( "#addphone", entry.phone );
	fillValue( "#addcomments", entry.comments );

	var upbtn = $( "<a/>").addClass( "waves-effect waves-green btn-flat" ).attr( "href", "#!" ).text( 'Update' );

	upbtn.click( function(e){

		if( $("#entry-form").valid() ){
			$( "#addaccount" ).removeAttr( "disabled" );

			var url = getServiceURL( "zipx/addresses/"+entry.account );
			var j_obj = {};
			var v = formToJson( $("#entry-form"), true );
			j_obj["customer"] = v;
			console.log( JSON.stringify( j_obj ) );
			sendJSONRequest( "PUT", url, JSON.stringify( j_obj ), function( data){
				$( "#entryFormModal" ).closeModal();
				var div = $( "div[for="+v.account +"]" );
				var spn = div.prev().find( 'span' ).find('span');
				spn.empty().append( joinIntoSpan( v.account, v.name ) );
				if( div.is( ":hidden" ) ) { div.show(); }
				var holder = div.find( "p:first" );
				holder.empty();
				holder.append( presentFlatEntryValuesTable( v, 'address1', 'address2', 'city', 'state', 'zip', 'country', 'contact', 'phone', 'comments' ) );
				//holder.effect( "highlight",  { color: '#FFFF50' }, 3500 );
				flashme( holder, '#FFFF50', 3500 );
				$( "#innerContentHead" ).empty();
			});
		}
	});

	$("#entryFormFooter").append( upbtn );
	$("#entryFormModal").openModal();
}

function setupNewEntryForm(){
	$("#entryFormFooter").empty();
	$( "#addaccount" ).removeAttr( "disabled" );
	clearForm( $("#entry-form") );
	$("#entryFormTitle").text( "Add a new address" );

	var adbtn = $( "<a/>").addClass( "waves-effect waves-green btn-flat" ).attr( "href", "#!" ).text( 'Add' );
	adbtn.click( function(e){
		if( $("#entry-form").valid() ){
			var acct = $( "#addaccount" ).val().substring(0, 2);
			var j_obj = {};
			var cust = formToJson( "#entry-form" );
			cust['provide_service'] = 'Y';
			j_obj["customer"] = cust;
			sendJSONRequest("POST", getServiceURL( "zipx/addresses/"+acct ), JSON.stringify( j_obj ), function( data ){ 
				console.log( "service completed: " + JSON.stringify( data ) );
				$("#entryFormModal").closeModal();
				var arr = new Array();					
				arr.push( j_obj );
				displayTableAccordion( arr  );
			});

		}
	});
	$("#entryFormFooter").append( adbtn );
	$("#entryFormModal").openModal();
}
function fillValue( target, value, disableInput ){
	if ( disableInput === undefined ) disableInput = false;
	if( value ){ 
		$( target ).val( value );
		$( target ).next( "label ").addClass( "active");
	} 
	if( disableInput ) $( target ).attr( "disabled",  "");
}

function FormChangesToObject( form ) {
	// get form  http://blogs.sitepointstatic.com/examples/tech/formchanges/formchanges.js
	if (typeof form === "string") form = document.getElementById(form);
	if (!form || !form.nodeName || form.nodeName.toLowerCase() !== "form") return null;

	// find changed elements
	var changed = [], n, c, def, o, ol, opt;
	for (var e = 0, el = form.elements.length; e < el; e++) {
		n = form.elements[e];
		c = false;
		switch (n.nodeName.toLowerCase()) {
			// select boxes
			case "select":
				def = 0;
				for (o = 0, ol = n.options.length; o < ol; o++) {
					opt = n.options[o];
					c = c || (opt.selected !== opt.defaultSelected);
					if (opt.defaultSelected) def = o;
				}
				if (c && !n.multiple) c = (def !== n.selectedIndex);
				break;

			// input / textarea
			case "textarea":
			case "input":
				switch (n.type.toLowerCase()) {
					case "checkbox":
					case "radio":
						// checkbox / radio
						c = (n.checked !== n.defaultChecked);
						break;
					default:
						// standard values
						c = (n.value !== n.defaultValue);
						break;				
				}
				break;
		}

		if (c) changed.push(n['id']);
	}
	var jobj = {};
	console.log( changed );
	for( var index in changed ){
		jobj[  $( "#"+ changed[ index ] ).attr('name') ] = $( "#"+ changed[ index ] ).val();
	}
	//return changed;
	return jobj;
}
//Utilities...
function toggleMe( target, hideF, showF ){
	if ( $( target ).is(":visible") ){
		$( target ).fadeOut( 1000, hideF );
		$( target ).addClass( 'hide' );
		
	}else{
		$( target ).removeClass( 'hide' );
		$( target ).show( 'bounce', 1000, showF );
	}
}

function flashme( target, color, delaytime, callback ){	
	  var dtm = delaytime ? delaytime : 1000;
	$(target).fadeTo('fast',0.2).fadeTo( 'slow', 1 ).css("background-color", color ).delay( dtm ).queue(function(){  
		$(target).css( "background-color", "" ).removeAttr( "style" ); 
		if (typeof callback === "function") { callback(); }
		$(this).dequeue(); 
	});
}
$(function(){
	$.validator.setDefaults({
		errorElement : 'div',
		highlight: function(element) { $(element).closest( '.input-field' ).find("i, input").addClass('invalid error');},  
		unhighlight: function(element) { $(element).closest( '.input-field' ).find("i, input").removeClass('invalid error');},
		errorPlacement: function(error, element) { var placement = $(element).data('error');
			if (placement) { $(placement).append(error); } else { error.insertAfter(element); }
		}
	});
	$( ".resetform" ).click( function(){
		clearForm( $(this).prev("form") );
	});
	$( "#logout_btn" ).click( function(){
		$("#addbook_block").addClass( function(){  $(this).addClass('disabled'); toggleMe( "#float_btn" ); 
			$( "#innerContent" ).empty(); $( "#innerContentHead" ).empty(); $( "#logon_msg" ).empty(); $("#token").val(''); 
				$("#tabs").tabs('select_tab', 'auth');} );		
	});
	
	$( "#login_btn" ).click( function(){
		if( $( "#logform" ).valid() ){
			$("#token").val(''); 
			var url = getServiceHost()+"/authority/token?_zipx";
			var creds = $( "#username" ).val()+"|"+$( "#password" ).val();
			$.ajax({ type: "HEAD", url: url, 
				beforeSend: function(request){
					request.setRequestHeader( "IBCCredentials", window.btoa( creds ) );
				},
				success:  head_success, error: head_failure  
			});
		}
	});
	$( "#listentry").click( function(e){
		if( tokenTest() ){
			if( $("#account").val() ){
				var url = getServiceURL( "zipx/addresses/"+$("#account").val() );
				sendJSONRequest( 'GET', url, null, function( data ){
					if( $.isArray(data) ){
						displayTableAccordion( data );
					}else{
						var arr = new Array();					
						arr.push( data );
						displayTableAccordion( arr  );
					}
				});
			}else{
				displayAlert( "Please enter a value first." );
			}
		}
	});
	$("#addEntry").click( function( e ){
		setupNewEntryForm();
	});
	$("#addContactBtn").click( function( e ){
		if( $("#contactForm").valid()  ){
			var acct = $( "#contactId" ).text();
			var url = getServiceURL( "zipx/addresses/"+acct+"/contacts" ); 
			var j_obj = {};
			var contact = formToJson( "#contactForm" );
			contact['id'] = acct;
			if( contact.email ){
				contact[ 'send_notices' ] = 'Y';
			}else{
				contact[ 'send_notices' ] = 'N';
			}
			var arr = [];
			arr.push( contact );
			j_obj[ "customer_contacts" ] = arr;   
			sendJSONRequest( 'POST', url, JSON.stringify( j_obj ), function( data ){ 
				console.log( "service completed: " + JSON.stringify( data ) );
				$("#addContact").closeModal();
				var item = toHTMLContactRow( contact );
				$("li[contact="+ contact.id +"]").find('table').append( item );
				//item.effect( "highlight",  { color: '#32CD32' }, 3500 );
				flashme( item, '#32CD32', 3500 );
				$( "#innerContentHead" ).empty();
			});
		}
	});
});
