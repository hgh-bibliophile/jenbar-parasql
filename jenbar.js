let jenbar = {}

jenbar.expandDate = function(event) {
	let domTarget = event.domEvent.target;
	// check for jQuery keydown events on the dom input element...
	if (!($._data(domTarget, "events"))?.keydown) {
		// if none exists, assign a keydown event
		let $target = $(domTarget);
		$target.keydown(function(e) {
			// if the pressed key was Enter (13) or Tab (9)...
			if ([9, 13].includes(e.keyCode || e.which)) {
				// check the input value for "/yyyy"...	
				let dStr = $target.val();
				if (!dStr || dStr.startsWith("/")) return;
				if (!dStr.match(/^(\d{1,2}\/){2}\d{4}$/)) { // Proper m/d/yyyy format
					let dtPts = dStr.split("/")
					if (dtPts.length == 3 && dtPts[2]?.length <= 2) { // m/d/y or /yy
						// if missing, expand "yy" to "yyyy"
						dtPts[2] = dayjs().year().toString().substring(0,2) + dtPts[2].padStart(2, '0')
					} else {									
						// Or default to current year if missing "yy" entirely
						dtPts.push(dayjs().year())
					}
					$target.val(dtPts.join("/"));
				}
			}
		});
	}
}

jenbar.expandHour = function(event) {
	let domTarget = event.domEvent.target;
	// check for jQuery keydown events on the dom input element...
	if (!($._data(domTarget, "events"))?.keydown) {
		// if none exists, assign a keydown event
		let $target = $(domTarget);
		$target.keydown(function(e) {
			// if the pressed key was Enter (13) or Tab (9)...
			if ([9, 13].includes(e.keyCode || e.which)) {
				// check the input value for ":x"...	
				let tStr = $target.val();
				if (!tStr.match(/:\w+$/)) {
					// if missing, add ":00" (or "00" if ":" is the last character) 
					// so parasql will accept it
					tStr += tStr.match(/:$/) ? "00" : ":00";
					$target.val(tStr);
				}
			}
		});
	}
}

export { jenbar }
