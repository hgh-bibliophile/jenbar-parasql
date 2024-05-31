var utils = function() {  
	this.dv = {
		setString(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setString(val)
			field.setDataValue(dv)
		},
		setNumber(id, val) {
			let field = parasql.app.getWidgetById(id)
			let dv = field.getDataValue()
			dv.setNumber(val)
			field.setDataValue(dv)
		}
	}

	
	this.expandDate = function(event) {
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

	this.expandHour = function(event) {
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

	this.copyRecord = function(recordObjectId, rFields, eFields) {
		let recordObject = parasql.app.getWidgetById(recordObjectId)
		let dt = recordObject.getDataTable();
		let oldRecord = dt.getRowAt(recordObject.getSelectedRowIndex());
		let dtColumns = dt.getColumns();
	
		recordObject.addIndividualRecord();
		let newRecord = dt.getRowAt(recordObject.getSelectedRowIndex());
	
		for (let x = 0; x < dtColumns.length; x++) {
			let cName = dt.getColumns()[x].getColumnName();
			if (rFields.includes(cName)) {
				console.log("Restricted Field");
			} else if (Object.keys(eFields).includes(cName)){
				let dvStr = oldRecord.getValueAt(x).getString();
				newRecord.getValueAt(x).setString(eFields[cName] + dvStr);
			} else {
				newRecord.getValueAt(x).takeValueFrom(oldRecord.getValueAt(x));
			}			
		}
	
		recordObject.redisplay();	
	}
} 
