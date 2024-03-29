/**
 * Global Functions
 * 
 * @author Matthew Dunham <matt@hotcoffeydesign.com>
 */

"use strict";

/**
 * Attempt to lock the screen orientation
 * 
 * @param {string} orientation
 * @returns {void}
 */
App.lockOrientation = function(orientation) {
	try {
		if ('undefined' !== typeof window.screen.lockOrientation)
			window.screen.lockOrientation(orientation);
		if ('undefined' !== typeof window.screen.orientation.lock)
			window.screen.orientation.lock(orientation);
	} catch (e) {}
};

/**
 * Unlock the screen orientation
 * 
 * @returns {void}
 */
App.unlockOrientation = function() {
	try {
		if ('undefined' !== typeof window.screen.orientation)
			window.screen.orientation.unlock();
		if ('undefined' !== typeof window.screen.unlockOrientation)
			window.screen.unlockOrientation();
	} catch (e) {}
};

/**
 * Print a document
 * 
 * @param {string} document Html to print
 * @param {string} name The name of the printed document
 * @returns {void}
 */
App.print = function(document, name) {
	if (window.printerId) {
		cordova.plugins.printer.print(document, { 
			printerId: window.printerId,
			graystyle: true,
			border: false,
			hidePageRange: true,
			hideNumberOfCopies: true,
			hidePaperFormat: true
		});
	} else {
		App.setupPrinter(App.print, document, name);
	}
};

/**
 * Attempt to connect to a printer
 * 
 * @param {function} callback Optional
 * @param {string} document
 * @param {string} name
 * @returns {void}
 */
App.setupPrinter = function(callback, document, name) {
	cordova.plugins.printer.check(function (available, count) {
		if (available) {
			var printCheck = function() {
				cordova.plugins.printer.pick(function (uri) {
					if (uri) {
						window.printerId = uri;
						if ('function' === typeof callback && document && name)
							callback(document, name);
					} else {
						window.printerId = false;
					}
				});
			};

			printCheck();
		} else {
			navigator.notification.alert('This device does not support printing. You will not be able to print receipts.');
		}
	});
};

window.refreshRoute = true;
window.routeCompleted = [];

/**
 * Convert meters into miles
 * 
 * @param {float} meters
 * @returns {float}
 */
function toMiles(meters) {
   return meters*0.000621371192;
};

/**
 * Convert seconds to hours
 * 
 * @param {int} seconds
 * @returns {float}
 */
function toHours(seconds) {
   return seconds/60/60;
};

/**
 * Format a number with thousdands commas
 * 
 * @param {string} x
 * @returns {string}
 */
function numberFormat(x) {
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

/**
 * Google Maps Intialization
 * 
 * @returns {void}
 */
function initMap() {
	console.log('Init map triggered');
}

/**
 * GeoTracking Helper Method
 * 
 * @todo 
 */
window.lastGeoPush = new Date().getTime();

window.GeoUpdate = function(position) {
	if ( ! window.currentUser || ! window.currentTruck) return false;
	let elapsed = new Date().getTime() - window.lastGeoPush;
	if ((window.lastCoord !== position.coords && elapsed > 60) || elapsed > 300) {
		window.lastGeoPush = new Date().getTime();
		window.lastCoord = position.coords;
		Api.post(App.Settings.apiUrl + '/geo-tags/add.json', {
			user_id: window.currentUser.id || '',
			truck_id: window.currentTruck.id || '',
			longitude: position.coords.longitude,
			latitude: position.coords.latitude,
			accuracy: position.coords.accuracy,
			heading: position.coords.heading,
			speed: position.coords.speed,
			altitude: position.coords.altitude
		}, function(response){
			
		});
	}
};

window.GeoUpdateError = function(error) {
	try {
		navigator.geolocation.clearWatch(window.watchID);
	} catch (e) {}
	setTimeout(() => {
		try {
			window.watchID = navigator.geolocation.watchPosition(window.GeoUpdate, window.GeoUpdateError, { timeout: 30000, enableHighAccuracy: true });
		} catch (e) {}
	}, 1000);
};