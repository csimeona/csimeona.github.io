//some global variables
var mymap=null;
var figureGround=null;
var massacreLayer=null;
var departmentLayer=null;
var departmentLabelLayer=null;
var myIncidentGeojson = null;
var myDepartmentGeojson = null;
//popup heading declarations. global for bilingual implementation
var massacreHead, victimHead, dateHead, locationHead, adminHead, reportHead, noteHead, massacreLegentHead, departmentLegendHead;

//*EDITABLE*color of markers 
var noResearch = '#ff5555'; //redish
var yesResearch = '#E6E600'; //yellowish

//*EDITABLE*color of departments
/* var class0 = '#fee5d9'; //no victims 
var class1 = '#ff8888'; //least victims
var class2 = '#ff6666';
var class3 = '#ff4444';
var class4 = '#ff2222';
var class5 = '#ff1111'; //most victims */

var class0 = '#fee5d9'; //no victims 
var class1 = '#ffb3b3'; //least victims
var class2 = '#ff9999';
var class3 = '#ff6666';
var class4 = '#ff1a1a';
var class5 = '#e60000'; //most victims 




//IMPORTANT:set the language by changing languageMode (needs to = 'english' for english version; can be anything else for espanol (for fallback reasons).
var languageMode='english';

//*EDITABLE*  assign popup window headings AND legend titles depending on the 'languageMode' setting,
if (languageMode == 'english'){
	//popup headings in English
	massacreHead = 'MASSACRE';
	victimHead = "VICTIMS"; 
	dateHead = 'DATE';
	locationHead = 'LOCATION';
	adminHead = 'MUNICIPALITY, DEPARTMENT';
	reportHead = 'REPORTS';
	noteHead = 'ADDITIONAL NOTES';
	
	//legend headings in English
	massacreLegendHead = 'Massacres by # of Victims';
	departmentLegendHead = 'Departmental Massacre Victim Rate<br><sup>(per 100,000 people)</sup>';
}
else {
	//popup headings in spanish
	massacreHead = 'MASACRE';
	victimHead = "V&Iacute;CTIMAS"; //&Iacute; = Í, (sometimes needed for html strings with special charachtars). Ñ = '&Ntilde;' and Ú = '&Uacute'; change letter and case as necessary
	dateHead = 'FETCHA';
	locationHead = 'LUGAR';
	adminHead = 'MUNICIPIO, DEPARTAMENTO';
	reportHead = 'INFORMES';
	noteHead = 'NOTAS ADICIONALES';
	
	//legend heading in Spanish
	massacreLegendHead = 'N&uacute;mero de V&iacute;ctimas';
	departmentLegendHead = 'N&uacute;mero de V&iacute;ctimas por Departamento';
}; 



$(document).ready(function() {
	//make the map object
	mymap = initializeMap();
	
	//makeLatLonBox();
	//L.control.scale({position: 'bottomright',metric: false}).addTo(mymap);
	
	mymap.addControl(L.mapbox.infoControl().addInfo('<b>Map By:</b> Charles Simeona, Nick Holt, Wyatt Hoffman<br> and Michael Lai <br> <b>Data Sources:</b> Grupo Ma&iacute;z and <a href="http://unfinishedsentences.org/">Unfinished Sentences</a> <br><b>Basemap</b>'));
	
	new L.Control.MiniMap(L.mapbox.tileLayer('mapbox.streets-basic'),{
		position: 'bottomright',
		height:135,
		aimingRectOptions: {fillColor:'#ff5555', color: '#ff5555', weight: 2}
	}).addTo(mymap);
				
			
	L.control.fullscreen({position:'topleft'}).addTo(mymap);
	
	mymap.on('fullscreenchange', function () {
		
		
		 if (mymap.isFullscreen()) {
			$('.range-slider').dateRangeSlider('resize');
		} else {
			$('.range-slider').dateRangeSlider('resize');
		}
	});

	
	makeSearchBox();
	
	//get the surounding countries and puts it on the map
	setupFigureGround();
	
	//makes a search box, searches the following columns of the ES_Massacres: massacreName, canton, casario, locationInfo, locationInfoEs, municipal, and department.
	//makeSearchBox();
	
	//gets basemaps and makes a 'switcher' for them
	var layerSwitcher = makeBasemapSwitcher(mymap);
	
	//gets and makes the department-level layer, and puts it in the 'switcher'
	var departmentLayers = getDepartments(layerSwitcher);
	
	//creates legend for departments
	var deptLegend = makeDepartmentLegend();
			
	//This one function is the beginning of a chained-link of functions that: grab and convert the ES_Massacres.xlsx into geojson, makes a layer containing each geojson object (massacre) with styles (color and size) based on attributes its attributes. and lastly, the layer is conected to the time-slide filter. 
	getMassacreList(mymap);
	
	//after the massacres and slider is on the map, this will create its legend
	var massacreLegend = makeMassacreLegend();
	
	//this function syncs legends with respective layers depending on if the layer is being shown. 
	syncLegendWithDeptLayers(deptLegend,massacreLegend );
	
	
	
	L.control.scale({position: 'topleft'}).addTo(mymap);
	makePlayButton();
	
	//testMilitaryImage();
	
	
	
});

/* function testMilitaryImage () {
	//L.imageOverlay(imageUrl, imageBounds[sw,ne]).addTo(mymap);
	L.imageOverlay('geoData/chalatenango2.jpg', [[13.999, -88.9999], [14.1655, -88.75]]).addTo(mymap);
	L.imageOverlay('geoData/paraiso.jpg', [[13.999, -89.25], [14.1655, -89.0001]]).addTo(mymap);
	L.imageOverlay('geoData/tejutla.jpg', [[14.1667, -89.25], [14.3332, -89.0002]]).addTo(mymap);
} */

function makePlayButton() {

	var playControl = new L.Control({position: 'bottomleft'});
	playControl.onAdd = function ( mymap) {
		var playButton = L.DomUtil.create('div', 'play');
		
		$(playButton).css({"background-color":"#fff", "border-radius":"3px" , "border": "1px solid rgba(0, 0, 0, 0.4)" ,"text-align":"center","margin-bottom":"10px", "height":"26px", "width":"26px", "top":"-1px"})
		.hover(
			function() {
				$(this).css("background-color", "#f8f8f8");
			  }, function() {
				$(this).css("background-color", "#fff");
		});
		
		$(playButton).append('<i class="fa fa-play"></i>');
			  
		
		 $(playButton).bind("click", function() {
			if ($(this).hasClass("play")) {
				$(this).removeClass( "play" ).addClass("pause");
				//$(this).children().attr('class', 'fa fa-pause');
				$(this).children().removeClass("fa fa-play").addClass("fa fa-pause");
				
				
				
				// get time values and get the difference in months
				var minMonth= $(".range-slider").dateRangeSlider('values').min.getMonth() + 1;
				if (minMonth <= 9){
					minMonth = "" + 0 + minMonth;
				}
				else
					maxMonth = "" + maxMonth;
				var minYear= $(".range-slider").dateRangeSlider('values').min.getYear() + 1;
				
				
				var maxMonth= $(".range-slider").dateRangeSlider('values').max.getMonth() + 1;
				if (maxMonth <= 9){
					maxMonth = "" + 0 + maxMonth;
				}
				else
					maxMonth = "" + maxMonth;
				var maxYear= $(".range-slider").dateRangeSlider('values').max.getYear() + 1;
				
				var aniStep =(maxYear - minYear) * 12 + (maxMonth - minMonth);
				var aniSpeed = getAniSpeed(aniStep);
				
				var dateDiff =$(".range-slider").dateRangeSlider('values').max - $(".range-slider").dateRangeSlider('values').min;
				var resetMax = new Date($(".range-slider").dateRangeSlider('bounds').min.valueOf() + dateDiff);
				var resetMin = new Date(1974, 0, 1);
				
				animate = setInterval(function () {
				
					
				
					if ( $(".range-slider").dateRangeSlider('values').max >= new Date(1992, 11, 1) ) {
						//alert('slider reached end');
						
						//alert(resetMax);
						//$("range-slider").dateRangeSlider("values", resetMin, resetMax);
						
						$(".range-slider").dateRangeSlider("min", resetMin);
						$(".range-slider").dateRangeSlider("max", resetMax);
						
						processSlideTime( $(".range-slider").dateRangeSlider('values') );
					
						/* $(".range-slider").dateRangeSlider('values').min = $(".range-slider").dateRangeSlider('bounds').min;
						$(".range-slider").dateRangeSlider('values').max = resetMax; */
					}
					else
						play(aniStep);
					
					
					
					//if right value = 12/1/1992 set left slider value to 1/1/1974, and right slider value to 1/1/1974+aniStep size
					
					//alert($(".range-slider").dateRangeSlider('values').max);
					//alert($(".range-slider").dateRangeSlider('bounds').max);
					
					
					
					
				}, aniSpeed);	
				
				
				
			/* 	animate = setInterval(function () {
					//if right value = 12/1/1992 set left slider value to 1/1/1974, and right slider value to 1/1/1974+aniStep size
					play()
				}, 150); */

			}
			else {
				$(this).removeClass( "pause" ).addClass("play");
				$(this).children().attr('class', 'fa fa-play');
				
				clearInterval(animate);
			}
		});	   
			  
		return playButton;
	}
	
	//lastly, add the play button to the map
	mymap.addControl(playControl); 

}

function getAniSpeed(aniStep) {
    return aniStep > 12  ?  1500:
		aniStep > 6   ?  1000:
		750;
}

function play(aniStep) {
    $(".range-slider").dateRangeSlider('scrollRight', aniStep);
}

//makes map object, grabs base maps, grab national boundary
function initializeMap(){
	L.mapbox.accessToken ='pk.eyJ1IjoiY2hzaW1lb25hIiwiYSI6ImNrdHFxY2l4bjB5bm4yd3BxeHd3NWhhbGkifQ.lZOz9Q5nqZPMcL33GOQ_oQ';
	
	//lock map to bounds; SW, NE
	var bounds = L.latLngBounds(L.latLng(12.9, -90.5), L.latLng(15.3, -87));
	var mapOptions = {
		zoom: 9,
		center: [13.78, -88.70], //     13.78, -88.835
		maxBounds: bounds,
		minZoom: 8,
		attributionControl:false
	};

	//make map object
	return new L.Map('mapContainer', mapOptions);
}

/* function makeLatLonBox() {
	L.control.mousePosition({position:'bottomright', numDigits:6}).addTo(mymap);
} */


function setupFigureGround() {
	//put El Salvador figure-ground layer on map oject
	$.ajax({
		dataType: "json",
		url: "geoData/esfigureground.geojson",
		success: function(geojson) {
			var myStyle = {
				'color':'#000000',
				'weight':0.5,
				'opacity':1
			};
			
			figureGround = L.geoJson(geojson,{
				style: myStyle,
				clickable: false
			}).addTo(mymap);
		}
	}).error(function() {console.log("There was an issue fetching esfigureground.geojson");});

}

//makes a search box. Searches within the following columns of the ES_Massacres: massacreName, canton, casario, locationInfo, locationInfoEs, municipal, and department.
function makeSearchBox() {
	var searchBox = L.control({position: 'topright'});
	searchBox.onAdd = function (mymap) {
		//creates an html input object with a class name of searchBox
		var input = L.DomUtil.create('input', 'searchBox');
		
		//set its placeholder depending on language mode
		var placeholderText;
		if (languageMode == 'english')
			placeholderText = 'Search';
		else
			placeholderText = 'Búsqueda';
			
		$(input).attr("placeholder", placeholderText);
		

		// stops zoom on double clicks in the text box
		L.DomEvent.disableClickPropagation( input );
	
		//calls the search method on every 'keyup' event
		$(input).keyup(search);
		
		return input;
		
	};
	searchBox.addTo(mymap); 
}



function makeBasemapSwitcher (mymap) {
	//put default grey basemap on map object
		var HEREcarnavDayGrey = L.tileLayer(			'http://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/carnav.day.grey/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
			attribution: '&copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
			subdomains: '1234',
			mapID: 'newest',
			app_id: 'NRlH3MhS0Lx00udumvEb',
			app_code: 'SkNWrCWJ1geBgq6TMrIl0Q',
			base: 'base',
			detectRetina: true
		}).addTo(mymap);  
	
	
	//grab more basemaps, this one is a streets layer and has great detail in place/street names
	var EsriWorldStreetMap = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
		attribution: '&copy; 2010 Esri, Tele Atlas, UNEP-WCMC',
		detectRetina: true
	});
	
	var mapboxTerrain = L.mapbox.tileLayer('csimeona.4847f7fa')
    // since layers load asynchronously through AJAX, use the
    // `.on` function to listen for them to be loaded before
    // calling `getTileJSON()`
    .on('ready', function() {
        // get TileJSON data from the loaded layer
        //var TileJSON = layer.getTileJSON();
    });
	
	var mapboxSatellite = L.mapbox.tileLayer('mapbox.satellite', {
		maxNativeZoom: 17
	});
	
	
	//satellite, streets and place names basemap
	/* var HEREhybridDay = L.tileLayer(
		'https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/maptile/{mapID}/hybrid.day/{z}/{x}/{y}/256/png8?app_id={app_id}&app_code={app_code}', {
		attribution: 'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
		subdomains: '1234',
		mapID: 'newest',
		app_id: 'NRlH3MhS0Lx00udumvEb',
		app_code: 'SkNWrCWJ1geBgq6TMrIl0Q',
		base: 'aerial',
		detectRetina:true
	}); */
	
	
	//set the layer switcher text language (was unable to store in variables, so it must be set here)
	//You can rename them as well by changing 'theText' part of the format
	if (languageMode == 'english') {
		var basemaps = {
			//format = theText: layerVariable 
			Grayscale: HEREcarnavDayGrey,
			Streets: EsriWorldStreetMap,
			Terrain: mapboxTerrain,
			Satellite: mapboxSatellite
		};
	}
	else  {
		var basemaps = {
			//format = theText: layerVariable 
			'Escala de Grises': HEREcarnavDayGrey,
			'Calles y lugares': EsriWorldStreetMap,
			'Terreno': mapboxTerrain,
			'Sat&eacute;lite': mapboxSatellite
		};
	} 
	
	return L.control.layers(basemaps, null ,{position:'topright'}).addTo(mymap);
}


//grabs department file, and puts it in the switcher
function getDepartments(layerSwitcher) {
	//department layer
	$.ajax({
		dataType: "json",
		url: "geoData/esdepartments.geojson",
		success: function(geojson) {
			//store geojson in global variable
			myDepartmentGeojson = geojson;
			
			//make two layers from this department data; one polygons for department display, and one for their labels (camoflouged markers)
			departmentLayer = makeDepartmentLayer(geojson);
			departmentLabelLayer = makeDepartmentLabelLayer(geojson);
			
			//go through each department and set its INITIAL popup (only used at loading, an ALMOST identical set of code for department popups are located in the 'adjustDepartmentStles()' function)
			departmentLayer.eachLayer(function (layer) {
				if (languageMode == 'english') {
					var description = ' people within selected time-range';
				}
				else {
					var description =' personas dentro de rango de tiempo seleccionado';
				}
				
				// this is just the initial popup content, no aggregations yet made; using a static deptvictimcount property in the department.geojson file
				var popupContent = '<div class="popupWindow">' +
					'<div class="popupHead"><h1>' + layer.feature.properties.nom_dpto + '</h1></div>' +
					'<div class="popupInfo"><h4>'+
					victimHead +
					'</h4><p>' + layer.feature.properties.deptvictimcount + description + '<p></div></div>';
					
				layer.bindPopup(popupContent,{
					minWidth: 190,
					maxWidth: 190,
					maxHeight:200
				});
			});
			
			//create a layerGroup for the two layers so that they act like one
			var departmentLayers = L.layerGroup();
			
			//add layers toLayerGroup
			departmentLayers.addLayer(departmentLabelLayer);
			departmentLayers.addLayer(departmentLayer);
			
			//add the layerGroup to the layer switcher. 
			if (languageMode == 'english')
				layerSwitcher.addOverlay(departmentLayers, "Departments");
			else
				layerSwitcher.addOverlay(departmentLayers, "Departamentos");
			
			
			//so we dont overzoom in 'Department' mode
			mymap.on('overlayadd', function(e){
				if (e.name === 'Departments'|| e.name === 'Departamentos')
					mymap.setZoom(9);
					//mymap._layersMaxZoom=10;
			});
			/* mymap.on('overlayremove', function(e) {
				if (e.name === 'Departments'|| e.name === 'Departamentos')
					//mymap._layersMaxZoom=21;
			}); */
			
			
			 //get another set of department and thier labels for satellite visual reference, set opacity to 0
			var satelliteDepts = makeDepartmentLayer(myDepartmentGeojson);
			satelliteDepts.setStyle({fillOpacity: 0.0, opacity: 0.2, weight: 1, clickable: false});
			
			//send to be synced with Satellite basemap
			syncSatelliteLayers(satelliteDepts); 
			
		 }
	}).error(function() {
		console.log("There was an issue fetching esdepartments.geojson");
	});
} 


//takes a geojson and returns as layer
function makeDepartmentLayer (geojson) {
	return L.geoJson(geojson,  {
		style: getDeptStyle
	});
}

//sets initial department stylings based on departmentvictimcount 
function getDeptStyle(feature) {
	return {
		weight: 1,
		opacity: 0.7,
		color: '#333333',
		fillOpacity: 0.8,
		//fillColor: getDeptColor(feature.properties.deptvictimcount)
		fillColor: getDeptColor((feature.properties.intersect_/feature.properties.pop1982) *100000)
	};
}

// get color depending on departments victim value. 
//Manually classified roughly by Jenks (Break intervals calculated @ 0-114, 115-403, 404-758, 759-1166, 1167-1973)
function getDeptColor(victims) {
    /* return victims > 1000  ?  class5:
		victims > 800   ?  class4:
		victims > 400   ?  class3:
		victims > 100   ? class2:
		class1; */
		
		return victims > 500  ?  class5:
		victims > 100   ?  class4:
		victims > 30   ?  class3:
		victims > 0    ?  class1:
		class0;
}


//takes the geojson and makes a label layer
function makeDepartmentLabelLayer (geojson) {

	var departmentLabelLayer = L.geoJson();
	
	L.geoJson(geojson,{
		clickable: false,
		onEachFeature: function (feature, layer) {
		
			var latLon = layer.getBounds().getCenter();
			var labelText = feature.properties.nom_dpto;
			L.marker(latLon, {
				icon: createLabelIcon("textLabel",labelText), 
				clickable: false, 
				zIndexOffset:999
			}).addTo(departmentLabelLayer); 

		}
	});
	
	return departmentLabelLayer;
}



//creates department labels for when in department mode
function createLabelIcon(labelClass,labelText){
  return new L.divIcon({ 
    className: labelClass,
    html: '<h6>'+ labelText + '</h6>',
	iconSize: [120,0],
	iconAnchor: [40,15]
  });
}




//makes the legend for the 'department mode'
function makeDepartmentLegend() {
	//build legend
	var legend = L.control({position: 'bottomright'});
	legend.onAdd = function (mymap) {
		var div = L.DomUtil.create('div', 'info legend');
		
		L.DomEvent.addListener(div, "mousedown", function(e) { L.DomEvent.stopPropagation(e); }); 
	
		var grades = [0, 30, 100, 500],
		labels = [],
		from, to;
		
		
		labels.push('<h1>'+ departmentLegendHead +'</h1>');

		labels.push(
				'<i style="background:' + getDeptColor(0) + '"></i> ' +
					'0');
		
		for (var i = 0; i < grades.length; i++) {
			from = grades[i]+1;
			to = grades[i + 1];

			labels.push(
				'<i style="background:' + getDeptColor(from + 1) + '"></i> ' +
					from + (to ? '&ndash;' + to : '-1300'));
		}
		
		
		div.innerHTML = labels.join('<br>');
		
		$(div).append('<hr>');
		
		/* new L.Control.MiniMap(L.mapbox.tileLayer('mapbox.streets'),{
		position: 'topright',
		width: 200,
		height: 200
		}).appendTo(div); */
	
		return div;
		
	};

	return legend;  
}


//When in satellite basemap view we want some department boundaries and to make the figure-ground darker
function syncSatelliteLayers(deptLayers) {
	mymap.on('baselayerchange', function (eventLayer) {
		if (eventLayer.name === 'Satellite' || eventLayer.name == 'Sat&eacute;lite') {
			//deptLayers.addTo(mymap);
			figureGround.setStyle({fillOpacity: 0.5, weight:1});
		}
		else { 
			//back to normal
			//mymap.removeLayer(deptLayers);
			figureGround.setStyle({fillOpacity: 0.2, weight:0.5});
		}
	}); 
	
}

//gets the ES_Massacres.xlsx file
function getMassacreList(mymap) {
	// set up XMLHttpRequest 
	var url = "geoData/ES_Massacres.xlsx";
	var oReq = new XMLHttpRequest();
	oReq.open("GET", url, true);
	oReq.responseType = "arraybuffer";

	oReq.onload = function(e) {
		var arraybuffer = oReq.response;

		/* convert data to binary string */
		var data = new Uint8Array(arraybuffer);
		var arr = new Array();
		for(var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
		var bstr = arr.join("");
		
		//read the binary string and generate an xlsx workbook, which contains sheets; in this case the sheet is the massacre list
		var wb = XLSX.read(bstr, {type:"binary"});
		
		//grab the massacre list sheet from the massacre list workbook (by name, hence wb.SheetNames[0]. 
		var sheet = wb.Sheets[wb.SheetNames[0]];
		//then turn the sheet into csv
		var	csv = XLSX.utils.sheet_to_csv(sheet);
		
		//we have converted .xlsx to .csv. now we need to convert the csv to geojson
		CSVtoGEOJSON(csv, mymap);
	};
	//now that we have set what to do when a request for the xlsx file is made, we make the request. 
	oReq.send();
}

//converts the ES_Massacres from .csv to .geojson, a well supported webmap data format. 
function CSVtoGEOJSON (csv, mymap) {
	csv2geojson.csv2geojson(csv, {
		latfield: 'latitude',
		lonfield: 'longitude',
		delimiter: ','
	}, function(err, geojsonData) {
		//after csv to geojson conversion, we send the geojson to be styled
		styleMassacres(geojsonData, mymap);
	});  
}

//make the massacre marker layer from the geojson, and put it on the map
function styleMassacres(geojson,mymap) {
	//first create new layer for the markers, pass it the massacreList geojson, which will go through each massacre (using pointToLayer) and 
	myIncidentGeojson = geojson;
	
	//makes the layer by going through each massacre/geojson object
	massacreLayer = L.mapbox.featureLayer(geojson, {
		pointToLayer: function(feature, latlon) {
		
			//build the popupcontent depending on language
			if (languageMode == 'english'){
				var victimInfo = feature.properties.victimInfo;
				var dateInfo = feature.properties.dateInfo;
				var locationInfo = feature.properties.locationInfo;
			}
			else {
				var victimInfo = feature.properties.victimInfoEs;
				var dateInfo = feature.properties.dateInfoEs;
				var locationInfo = feature.properties.locationInfoEs;
			}
			
			if (languageMode == 'english') {
				var massTitle = '<h1><b>The<br>'+ feature.properties.massacreName + ' Massacre</b></h1>';
			}
			else {
				var massTitle = '<h1><b>El masacre de<br>'+ feature.properties.massacreName + '</b></h1>';
			}
			
			//the part that 'builds' the popup content using the above variables
			var contentFirstPart = '<div class="popupWindow">'+
					'<div class="popupHead">'+
						massTitle +
					'</div>'+
					'<div class="popupInfo">'+
						'<h4>' + victimHead + '</h4>'+
						'<p>' + victimInfo + '</p>'+
						'<h4>' + dateHead +'</h4>'+
						'<p>' + dateInfo + '</p>'+
						'<h4>'+ locationHead +'</h4>'+
						'<p>' + locationInfo + '</p>'+
						'<h4>' + adminHead +'</h4>'+
						'<p>' + feature.properties.municipal + ', ' + feature.properties.department + '</p>';
						
			//end of first part; now for some IF tests			
			var contentConcat = contentFirstPart;
			
			//check if there's additionalNoteInfo text to display
			if (feature.properties.additionalNoteInfo !== "") {
				var notesPart = '<h4>'+ noteHead +'</h4>'+
								'<p> ' + feature.properties.additionalNoteInfo + '</p>';
				contentConcat += notesPart;
			}
			
			//Check to see if the massacre has a reportLink attribute. If it does, it gets added to our info window HTML string that we are now making. 
			if (feature.properties.reportLink !== '') {
			
				if (languageMode == 'english') {
					var reportPart = '<hr><h4>'+ reportHead +'</h4>' + 
					'<p>' + feature.properties.reportLink + '</p>'; 
					//'<p><a' + ' ' + 'href="' + feature.properties.reportLink + '" class="reportLink"' + ' >Navigate to report</a></p>';
					contentConcat += reportPart;
				}
				else {
					var reportPart = '<hr><h4>'+ reportHead +'</h4>' + 
					'<p>' + feature.properties.reportLinkEs + '</p>'; 
					//'<p><a' + ' ' + 'href="' + feature.properties.reportLink + '" class="reportLink"' + ' >Navigate to report</a></p>';
					contentConcat += reportPart;
				}
				
			}
			
			/* 	
			//TO OUR PARTNERS: if there are multiple sources for a certain massacre's research:  Make a new column in the massacrelist excel file named reportLink2, then fill in the url for the massacre's row. lastly uncomment this code (notice this lacks a h4 heading in order to keep the reports grouped in the popup window) 
			
			if (feature.properties.reportLink2 !== "") {
				if (languageMode == 'english') {
					var report2Part = '<hr><h4>'+ reportHead +'</h4>' + 
					'<p>' + feature.properties.reportLink + '</p>'; 
					contentConcat += report2Part;
				}
				else {
					var report2Part = '<hr><h4>'+ reportHead +'</h4>' + 
					'<p>' + feature.properties.reportLinkEs + '</p>'; 
					contentConcat += report2Part;
				}
				var report2Part = '<p><a href="' + feature.properties.reportLink2 + '">Navigate to available research</a></p>';
				contentConcat += report2Part;
			} 
			*/
			
			
			//end popup info section
			contentConcat += '</div>';
			
			//end popup window		
			contentConcat += '</div>';
			
			//the full popup html
			var popupHTMLcontent = contentConcat;
			
			
			//makes the circle its radius based on the number of victims, and the color based on IF there is a report for the massacre. we then bind the popup with its content, and make it so the map centers the marker on click as well. lastly, add it to the map.
			var marker = L.circleMarker(latlon, 
			{
				radius: getRadius(feature.properties.victimCount), 
				fillColor: getMarkerColor(feature),
				weight: 1, 
				color: '#000000', 
				opacity: 0.7,
				fillOpacity:0.8
			})
			.bindPopup(popupHTMLcontent,{
				minWidth: 190,
				maxWidth: 190,
				maxHeight:200
			}).
			on('click', function() {mymap.panTo(latlon)});
			
			return marker;
		}	
	}).addTo(mymap);
	
	//after markers are set we pull the ones with research available to the top for easy access and visibility
	bringResearchToFront();
	
	//now that all the markers are on the map we will connect it to a time range slider
	initializeSlider(geojson, massacreLayer);
}

//brings yellow markers to top. only used on initialization; slide changes use different methodology which I think is more efficient than calling this function on slide changes.
function bringResearchToFront(){
	massacreLayer.eachLayer(function (layer) {
		if (layer.feature.properties.reportLink !== "") {
			layer.bringToFront();
		}
	});
}

//returns a marker color based on if there is anything in the reportLink field of the massacrelist
function getMarkerColor(feature) {
	if (feature.properties.reportLink !== '') {		
		return yesResearch; //yellowish
	}
	else return noResearch; //red 
}


// get marker radius depending on victimCount value. 
//Manually classified by Jenks into 4 classes (Break intervals calculated @ 0-50, 51-150, 151-400, 401-600)
function getRadius(victims) {
	return victims > 400  ?  24:
		victims > 150   ?  18:
		victims> 50 ? 11:
		5;
}

//makes a legend for the circle markers
function makeMassacreLegend() {
	//build legend
	var legend = L.control({position: 'bottomright'});
	legend.onAdd = function (mymap) {
		var legendContainer = L.DomUtil.create("div", "massacreLegend");
		var symbolsContainer = L.DomUtil.create("div", "symbolContainer");
		var classes = [600, 400, 150, 50]; //for label
		var radiuses = [24, 18, 11, 5]; //for legend circle size
		var legendCircle;
		var lastRadius = 0;
		var currentRadius;
		var margin;
		
		//make it so clicks on it wont interact with map (i.e. accidental zoom)
		L.DomEvent.addListener(legendContainer, "mousedown", function(e) { 
			L.DomEvent.stopPropagation(e); }); 
			
		//start a string of html for all legend components      
		$(legendContainer).append('<h1 id="massacreTitle">'+ massacreLegendHead +'</h1>');	
		
		for (var i = 0; i <= classes.length-1; i++) {  

			legendCircle = L.DomUtil.create('div', 'legendCircle');  
			
			currentRadius = radiuses[i];
			
			margin = (-currentRadius - lastRadius );

			$(legendCircle).attr('style', 'width: ' + currentRadius*2 + 
				'px; height: ' + currentRadius*2 + 
				'px; margin-left: ' + margin + 'px; background: ' + noResearch  );
				
			$(legendCircle).append('<span class="legendValue">'+classes[i]+'</span>');
			$('.legendValue').offset({top:-4,left:0});
		

			$(symbolsContainer).append(legendCircle);

			lastRadius = currentRadius;
		}

		$(legendContainer).append(symbolsContainer); 
		
		if (languageMode == 'english') {
			var note = '*<mark>Yellow</mark> indicates available research';
		}
		else {
			var note ='*<mark>Amarillo</mark> indica la investigación disponible';
		}
		
		var legendNote=L.DomUtil.create('small', 'legendNote'); 
		$(legendNote).append(note);
		$(legendContainer).append(legendNote);
		
		$(legendContainer).append('<hr>');
		
		return legendContainer; 
	};
	
	
	legend.addTo(mymap); 

	return legend;
}
	 
//syncs massacres and departments, and their legends, based on which mode the map is in. 	 
 function syncLegendWithDeptLayers(deptLegend, massacreLegend) {
	mymap.on('overlayadd', function (eventLayer) {
		// Switch to the Departmento legend...
		massacreLayer.setFilter( function(feature) { return false; });
		this.removeControl(massacreLegend);
		deptLegend.addTo(this);
		
	}); 
	
	mymap.on('overlayremove', function (eventLayer) {
		// Switch to the massacre legend...
		this.removeControl(deptLegend);
		massacreLegend.addTo(this);
		//when switching out of department mode, filter the massacreLayer based on time-slider
		var values = $(".range-slider").dateRangeSlider("values");
		processSlideTime(values);
		//then make the massacreLayer visible
		massacreLayer.setFilter( function(feature) { return true; });
	}); 
} 


//sets up the slider. you may wish to tinker with 'wheelSpeed' and 'step' (step can be in days months or years)
//documentation for slider @ www.http://ghusse.github.io/jQRangeSlider/
function initializeSlider(geojson, massacreLayer) {
	var sliderControl = new L.Control({position: 'bottomleft'});
	sliderControl.onAdd = function ( mymap) {
		var slider = L.DomUtil.create('div', 'range-slider');
		
		//L.DomEvent.addListener(slider, 'mousedown', function(e) { 
			//L.DomEvent.stopPropagation(e); 
		//});
		
		L.DomEvent.disableClickPropagation( slider );
		
		$(slider).dateRangeSlider( {
			wheelMode: "scroll", 
			wheelSpeed: 1,
			//extent of massacre dates set manually here
			bounds: {min: new Date(1974, 0, 1), max: new Date(1992, 11, 31)},
			//the slider's starting values; must be in range of bounds
			defaultValues: {min: new Date(1974, 0, 1), max: new Date(1992, 11, 31)},
			//arrows: false,
			//set slider snapping; can use days, months or years
			step:{months:1},
			//Set how the date is displayed in the two slider 'nodes'
			formatter:function(val){
				var day = val.getDate(),
				month = val.getMonth() + 1, //javascript's months go from 0 to 11, so add 1 when getting its value. 
				year = val.getFullYear();
				return month + "/" + day + "/" + year; // Displays as month/day/year 
			},
			scales: [{
				next: function(val){
					var next = new Date(val);
					return new Date(next.setUTCFullYear(next.getFullYear() + 1));//label every 1 year
				},
				label: function(val){
					return val.getFullYear();
				}
			}]
		//when the slider's values are changed...
		//can be 'changed' or 'changing' 
		}).bind("valuesChanging", function(e, data){ 
			//send for processing for comparison with massacre date data
			processSlideTime(data.values);
		});  
		return slider;
	}
	
	//lastly, add the slider to the map
	mymap.addControl(sliderControl);
	
} 


//takes the values from the slider and concatonates a comparable format to the massacre data (in our case: yyyymmdd)
function processSlideTime(values) {
	//grab and format date slider values (format to match database yyyymmdd column)
	var minYear = "" + values.min.getFullYear();
	var minMonth = values.min.getMonth()+1;
	if (minMonth <= 9){
		minMonth = "" + 0 + minMonth;// the "" concatonates digits to string
	}
	else
		minMonth = "" + minMonth; // "" turns numbers into string
			
	var minDate = values.min.getDate();
	if (minDate <=9)
		minDate = "" + 0 + minDate;//"" also concatonates numbers as string
	else
		minDate = "" + minDate
	
	var maxYear ="" + values.max.getFullYear();
	var maxMonth =values.max.getMonth() + 1; //months go from 0-11 in javascript
	if (maxMonth <= 9){
		maxMonth = "" + 0 + maxMonth;
	}
	else
		maxMonth = "" + maxMonth;
	
	var maxDate =values.max.getDate();
	if (maxDate <=9)
		maxDate = "" + 0 + maxDate;
	else
		maxDate = "" + maxDate
	
	var min = minYear+minMonth+minDate; 
	var max = maxYear+maxMonth+maxDate;
	
	min = parseInt(min);
	max = parseInt(max);
	
	//send slider's min and max yyyymmdd's 
	adjustLayersOnSlide(min, max);
}


//takes the yyyymmdd's of the slider and uses it to build a filter (filter1 and 2), of which are then passed the
function adjustLayersOnSlide(min, max) {
	
	
	//sets a filter for non research markers
	var filter1 = function(feature) {
		return feature.properties.yyyymmdd >= min && feature.properties.yyyymmdd <= max && feature.properties.reportLink == ""
	};
	//then set a research marker filter(to make sure they stay at the top)
	var filter2 = function(feature) {
		return feature.properties.yyyymmdd >= min && feature.properties.yyyymmdd <= max && feature.properties.reportLink !== "" 
	};
	
	//pass the filters into the geojson filter method which return massacres within date range. 
	var filtered1 = myIncidentGeojson.features.filter(filter1);
	var filtered2 = myIncidentGeojson.features.filter(filter2);
	
	//concatonate, the second to the first to keep the research markers on top
	var finalFilter = filtered1.concat(filtered2);
	
	
	//clear the massacre layer and add the new filtered data. it is styled based on the code where massacreLayer was first created in the styleMassacres() function.
	massacreLayer.clearLayers().setGeoJSON(finalFilter);
	
	//send filtered geojson to adjust style of departments. 
	adjustDepartmentStyles(finalFilter);
}


//this method sums up the newest time filtered markers' victimCount attributes to the department level.
//IMPORTANT THAT THE SPELLINGS OF MASSACRE LIST DEPARTMENTS REMAIN THE SAME FOR MATCHING WITH DEPARTMENT DATABASE NAMES.
//LETTER CASE IS NOT IMPORTANT.
function adjustDepartmentStyles(filteredGeoJson) {
	var filteredMarkers = filteredGeoJson;
	//iterate through each department
	
	departmentLayer.eachLayer(function (layer) {
		//start at 0
		var victimSum  = 0;
		var massacreCount = 0;
		//iterate through filtered data
		for (var i = 0; i< filteredMarkers.length ; i++) {
			var massacre = filteredMarkers[i];
			//compare department name to massacre department name; if matched we add the victime count
			if ( layer.feature.properties.nom_dpto.toLowerCase() == massacre.properties.department.toLowerCase() ) {
				var victims= parseInt(filteredMarkers[i].properties.victimCount);
				victimSum += victims;
				massacreCount++;
			}
		}
		
		
		//Done iterating all markers; set department color. (and continue through department iterations).
		//layer.setStyle({fillColor: getDeptColor(victimSum)});
		var victimRate = Math.ceil((victimSum/layer.feature.properties.pop1982) * 100000);
		layer.setStyle({fillColor: getDeptColor(Math.ceil(victimRate))});
		
		
		
		//*EDITABLE* format the popup description
		if (languageMode == 'english') {
			var victimsDescription = ' people within selected time-range';
			//var massacreDescription = ' massacres';
			//var avgDescription = ' victims per massacre';
		}
		else {
			var victimsDescription =' personas dentro de rango de tiempo seleccionado';
			//var massacreDescription = ' masacres';
			//var avgDescription = ' victimas per masacre';
		}
				
				
				
		// set the popup content
		var popupContent = '<div class="popupWindow">' +
			'<div class="popupHead"><h1>' + layer.feature.properties.nom_dpto + '</h1></div>' +
				'<div class="popupInfo"><h4>MASSACRES'+
					'</h4><p>' + massacreCount  + 
					' massacres</p>' +
					
					'<h4>' +
					victimHead +
					'</h4><p>' + victimSum + 
					' people</p>'+
					
					'<h4>AVERAGE</h4>'+
					'<p>' + Math.ceil(victimSum/massacreCount)  + 
					' victims per massacre</p>' +
					
					'<h4>MASSACRE VICTIM RATE PER 100,000 PEOPLE</h4>'+
					'<p>' + victimRate  + '</p>' +
					
					'</div>' +
				'</div>';
				
				
				
			//set the updated popup content
		layer.bindPopup(popupContent,{
			minWidth: 190,
			maxWidth: 190,
			maxHeight:200
		});
		
	});
	
	//calculate and adjust colors of department by its % of total (national) victims
	/* for (var i = 0; i < deptTotals.length; i++) {
			deptTotals[i].dept.setStyle({fillColor: getDeptColor(deptTotals[i].vict * 100 / victimNatSum)});
		}  */
	
}


//conducts a search of the markers
function search() {
    // get the value of the search input field, remove latin diacritics, and turn into lower case for comparison
	var searchString = cleanChars($(".searchBox").val()).toLowerCase();

	
    massacreLayer.setFilter(showMassacres);
	
    // here we're simply comparing the properties of each marker
    // to the search string, seeing whether the former contains the latter.
	function showMassacres(feature) {
		return cleanChars(feature.properties.massacreName).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.casario).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.canton).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.locationInfo).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.locationInfoEs).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.municipal).toLowerCase().indexOf(searchString) !== -1 || cleanChars(feature.properties.department).toLowerCase().indexOf(searchString) !== -1; 
		  
    }
	
}

//used in search box
function cleanChars(str) {
    str = str.replace(/[áãÁÃ]/g,"a");
    str = str.replace(/[éÉ]/g,"e");
	str = str.replace(/[íÍ]/g,"i");
    str = str.replace(/[óÓ]/g,"o");
	str = str.replace(/[úÚ]/g,"u");
    str = str.replace(/[ñÑ]/g,"n");
    return str.replace(/[^a-z0-9]/gi,''); // final clean up
}
